import sys
import subprocess
import pkg_resources

required = {"torch", "torchattacks", "torchvision", "numpy", "opencv-python", "Pillow", "tensorflow",
            "realesrgan", "pandas", "transformers==4.16", "timm", "fairscale", "sentencepiece", "psutil"}
if sys.platform == "darwin":
    required.remove("tensorflow")
    required.add("tensorflow-macos")
    required.add("tensorflow-metal")
installed = {pkg.key for pkg in pkg_resources.working_set}
missing = required - installed

if missing:
    python = sys.executable
    subprocess.check_call([python, "-m", "pip", "install", *missing], stdout=subprocess.DEVNULL)

import torch
import torchattacks
from torchvision import transforms
import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
from realesrgan import RealESRGANer
from realesrgan.archs.srvgg_arch import SRVGGNetCompact
from torchvision.utils import save_image
import models.deepbooru.deepbooru as deepbooru_module
import models.blip.blip as blip_module
import models.wdtagger.ASL as ASL
import pandas as pd
import math 
import argparse
import os

for device in tf.config.experimental.list_physical_devices("GPU"):
    tf.config.experimental.set_memory_growth(device, True)

dirname = os.path.dirname(__file__)

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"

def resize(image, dim):
    model_path = os.path.join(dirname, "models/upscaler.pt")
    model = SRVGGNetCompact(upscale=4, num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=16, act_type="prelu")
    upsampler = RealESRGANer(scale=4, model_path=model_path, model=model, tile=0, tile_pad=10, pre_pad=0, half=False)
    img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    output, _ = upsampler.enhance(img, outscale=4)
    output = cv2.resize(output, dim, interpolation=cv2.INTER_AREA)
    return Image.fromarray(cv2.cvtColor(output, cv2.COLOR_BGR2RGB))

def load_deepbooru_image(image, dim):
    global width 
    global height
    img = Image.open(image).convert("RGB")
    width = img.width
    height = img.height
    img = img.resize((dim, dim), resample=Image.BICUBIC)
    img = np.array(img)
    img = img.astype(np.float32)
    img = np.expand_dims(img, 0) / 255
    return torch.from_numpy(img).to(device)

def deepbooru(input, output, attack = "fgsm", epsilon = 10/255):
    global model
    model = deepbooru_module.DeepDanbooruModel()
    model.load_state_dict(torch.load(os.path.join(dirname, "models/deepbooru/deepbooru.pt"), map_location="cpu"))
    model.eval()
    model.to(device)
    img = load_deepbooru_image(input, 512)
    atk = torchattacks.FGSM(model, eps=epsilon)
    if attack == "pgd":
        atk = torchattacks.PGD(model, eps=shift_epsilon(epsilon, 0.1))
    elif attack == "mifgsm":
        atk = torchattacks.MIFGSM(model, eps=epsilon)
    probs = model(img)[0]
    random_indices = torch.multinomial(probs, 1)
    random_tensor = torch.nn.functional.one_hot(random_indices, num_classes=probs.shape[0])
    adv_image = atk(img, random_tensor.float())
    img2 = Image.fromarray((adv_image[0] * 255).cpu().numpy().astype(np.uint8))
    img2 = resize(img2, (width, height))
    img2.save(output)
    return img2

def predict_deepbooru(image):
    model = deepbooru_module.DeepDanbooruModel()
    model.load_state_dict(torch.load(os.path.join(dirname, "models/deepbooru/deepbooru.pt"), map_location="cpu"))
    model.eval()
    model.to(device)
    tags = []
    with torch.no_grad():
        probs = model(image)[0]
    for i, p in enumerate(probs):
        if p >= 0.5:
            tags.append(model.tags[i])
    return ", ".join(tags)

def load_blip_image(image, dim):
    global width 
    global height
    raw_image = Image.open(image).convert("RGB")
    width, height = raw_image.size
    transform = transforms.Compose([
        transforms.Resize((dim, dim), interpolation=transforms.InterpolationMode.BICUBIC),
        transforms.ToTensor()
    ])
    return transform(raw_image).unsqueeze(0).to(device)

def blip(input, output, attack = "pgd", epsilon = 10/255):
    global model
    model = blip_module.blip_decoder(pretrained=os.path.join(dirname, "models/blip/blip.pt"), image_size=384, vit="base")
    model.eval()
    model.to(device)
    img = load_blip_image(input, 384)
    atk = torchattacks.PGD(model, eps=epsilon)
    adv_image = atk(img, torch.tensor([1.0]))
    save_image(adv_image[0], output)
    img2 = Image.open(output)
    img2 = resize(img2, (width, height))
    img2.save(output)
    return img2

def predict_blip(image):
    model = blip_module.blip_decoder(pretrained=os.path.join(dirname, "models/blip/blip.pt"), image_size=384, vit="base")
    model.eval()
    model.to(device)
    with torch.no_grad():
        caption = model.generate(image)
        return caption[0]

def load_wdtagger_image(image, dim):
    global width 
    global height
    img = Image.open(image).convert("RGB")
    width = img.width
    height = img.height
    img = img.resize((dim, dim), resample=Image.BICUBIC)
    img = np.array(img)
    img = img.astype(np.float32)
    img = np.expand_dims(img, 0) / 255
    return tf.convert_to_tensor(img)

def wdtagger(input, output, attack = "fgsm", epsilon = 10/255):
    global model 
    model = load_model(os.path.join(dirname, "models/wdtagger/wdtagger"))
    img = load_wdtagger_image(input, 448)
    probs = model.predict(img)
    target_class = np.random.randint(probs.shape[-1])
    label = tf.one_hot(target_class, probs.shape[-1])
    with tf.GradientTape() as tape:
        tape.watch(img)
        prediction = model(img)
        loss_object = ASL.AsymmetricLoss()
        loss = loss_object(label, prediction)
    gradient = tape.gradient(loss, img)
    perturbations = tf.sign(gradient)
    adv_img = img + epsilon * perturbations
    adv_img = tf.clip_by_value(adv_img, 0.0, 1.0)
    adv_img *= 255.0
    tf.keras.utils.save_img(output, tf.squeeze(adv_img))
    img2 = Image.open(output)
    img2 = resize(img2, (width, height))
    img2.save(output)
    return img2

def predict_wdtagger(image, thresh = 0.3228):
    model = load_model(os.path.join(dirname, "models/wdtagger/wdtagger"))
    label_names = pd.read_csv(os.path.join(dirname, "models/wdtagger/selected_tags.csv"))
    probs = model.predict(image * 255)
    label_names["probs"] = probs[0]
    found_tags = label_names[label_names["probs"] > thresh]
    return ", ".join(found_tags["name"])

def combine_images(images, output):
    width = images[0].width 
    height = images[0].height
    new_image = Image.new("RGB", (width, height))
    y_offset = 0
    y_inc = math.ceil(height / len(images))
    for image in images:
        image = image.crop((0, y_offset, width, y_offset + y_inc))
        new_image.paste(image, (0, y_offset))
        y_offset += y_inc
    new_image.save(output)

def shift_epsilon(epsilon, shift):
    new_epsilon = epsilon + shift
    if new_epsilon < 0:
        return epsilon
    if new_epsilon > 1:
        return epsilon
    return new_epsilon


def main():
    parser = argparse.ArgumentParser(prog="CLIP Breaker")
    parser.add_argument("-m", "--mode")
    parser.add_argument("-i", "--input")
    parser.add_argument("-o", "--output")
    parser.add_argument("-d", "--deepbooru", action="store_true")
    parser.add_argument("-b", "--blip", action="store_true")
    parser.add_argument("-w", "--wdtagger", action="store_true")
    parser.add_argument("-a", "--attack")
    parser.add_argument("-e", "--epsilon")
    args = parser.parse_args()

    attack = args.attack if args.attack else "fgsm"
    epsilon = float(args.epsilon) if args.epsilon else 10/255

    if args.mode == "attack":
        images = []
        if args.deepbooru:
            img = deepbooru(args.input, args.output, attack, epsilon)
            images.append(img)
        if args.blip:
            img = blip(args.input, args.output, attack, shift_epsilon(epsilon, 0.1))
            images.append(img)
        if args.wdtagger:
            img = wdtagger(args.input, args.output, attack, shift_epsilon(epsilon, -0.05))
            images.append(img)
        combine_images(images, args.output)
    elif args.mode == "predict":
        text = []
        if args.deepbooru:
            tags = predict_deepbooru(load_deepbooru_image(args.input, 512))
            text.append("DeepBooru:")
            text.append(tags)
        if args.wdtagger:
            tags = predict_wdtagger(load_wdtagger_image(args.input, 448))
            text.append("WDTagger:")
            text.append(tags)
        if args.blip:
            tags = predict_blip(load_blip_image(args.input, 384))
            text.append("BLIP:")
            text.append(tags)
        f = open(args.output, "w")
        f.write("\n".join(text))
        
if __name__ == "__main__":
    main()
