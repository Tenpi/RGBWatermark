import sys
import subprocess
import pkg_resources

required = {"torch", "pytorch_lightning", "safetensors", "onnx"}
installed = {pkg.key for pkg in pkg_resources.working_set}
missing = required - installed

if missing:
    python = sys.executable
    subprocess.check_call([python, "-m", "pip", "install", *missing], stdout=subprocess.DEVNULL)

import os
import torch 
from safetensors import safe_open
from safetensors.torch import save_file
import onnx
from onnx import numpy_helper
import numpy
import argparse
import pathlib

device = torch.device("cpu")

if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")

def check_filesize_match(input, output):
    input_size = os.stat(input).st_size / (1024 * 1024)
    output_size = os.stat(output).st_size / (1024 * 1024)
    return round(input_size) == round(output_size)

def is_lora(input):
    input_size = os.stat(input).st_size / (1024 * 1024)
    return round(input_size) < 2000

def randomize_ckpt(input, output, half = False):
    model = torch.load(input, map_location=device)
    state_dict = model["state_dict"]
    i = 0
    for key in state_dict.keys():
        if key == "state_dict":
            continue
        i += 1 
        if i % 10 == 0:
            size = state_dict[key].size()
            if half:
                state_dict[key] = torch.rand(size).half()
            else:
                state_dict[key] = torch.rand(size)
    torch.save(model, output)

def randomize_safetensors(input, output, half = True):
    model = safe_open(input, framework="pt")
    tensors = {}
    i = 0
    skip = 10
    if is_lora(input):
        skip = 1
    for key in model.keys():
        i += 1 
        if i % skip == 0:
            size = model.get_tensor(key).size()
            if half:
                tensors[key] = torch.rand(size).half()
            else:
                tensors[key] = torch.rand(size)
        else:
            if half:
                tensors[key] = model.get_tensor(key).half()
            else:
                tensors[key] = model.get_tensor(key)
    save_file(tensors, output)

def randomize_pt(input, output, half = False):
    model = torch.load(input, map_location=device)

    # VAE
    if "state_dict" in model:
        state_dict = model["state_dict"]
        i = 0
        for key in state_dict.keys():
            if key == "state_dict":
                continue
            i += 1
            if i % 10 == 0:
                size = state_dict[key].size()
                if half:
                    state_dict[key] = torch.rand(size).half()
                else:
                    state_dict[key] = torch.rand(size)
    
    # Hypernetwork
    if 768 in model:
        for d in model[768]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = torch.rand(size).half() if half else torch.rand(size)
    if 1024 in model:
        for d in model[1024]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = torch.rand(size).half() if half else torch.rand(size)
    if 320 in model:
        for d in model[320]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = torch.rand(size).half() if half else torch.rand(size)
    if 640 in model:
        for d in model[640]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = torch.rand(size).half() if half else torch.rand(size)
    if 1280 in model:
        for d in model[1280]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = torch.rand(size).half() if half else torch.rand(size)
    
    # Textual Inversion
    if "string_to_param" in model:
        for key in model["string_to_param"]:
            size = model["string_to_param"][key].size()
            model["string_to_param"][key] = torch.rand(size).half() if half else torch.rand(size)
    
    torch.save(model, output)

def randomize_onnx(input, output, half = False):
    model = onnx.load(input)
    for i in range(len(model.graph.initializer)):
        if i % 10 == 0:
            tensor = model.graph.initializer[i]
            weight = onnx.numpy_helper.to_array(tensor)
            rand = numpy.random.rand(*weight.shape)
            rand_tensor = None
            if half:
                rand_tensor = numpy_helper.from_array(rand.astype(numpy.float16))
            else:
                rand_tensor = numpy_helper.from_array(rand.astype(numpy.float32))
            model.graph.initializer[i].CopyFrom(rand_tensor)
    onnx.save(model, output)

def randomize_bin(input, output, half = False):
    model = torch.load(input, map_location=device)
    for key in model.keys():
        size = model[key].size()
        if half:
            model[key] = torch.rand(size).half()
        else:
            model[key] = torch.rand(size)
    torch.save(model, output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="Network Randomizer")
    parser.add_argument("-i", "--input")
    parser.add_argument("-o", "--output")
    args = parser.parse_args()

    ext = pathlib.Path(args.input).suffix

    if ext == ".ckpt":
        randomize_ckpt(args.input, args.output)
        if not check_filesize_match(args.input, args.output):
            randomize_ckpt(args.input, args.output, True)
    elif ext == ".safetensors":
        randomize_safetensors(args.input, args.output)
        if not check_filesize_match(args.input, args.output):
            randomize_safetensors(args.input, args.output, False)
    elif ext == ".onnx":
        randomize_onnx(args.input, args.output)
        if not check_filesize_match(args.input, args.output):
            randomize_onnx(args.input, args.output, True)
    elif ext == ".pt":
        randomize_pt(args.input, args.output)
        if not check_filesize_match(args.input, args.output):
            randomize_pt(args.input, args.output, True)
    elif ext == ".bin":
        randomize_bin(args.input, args.output)
        if not check_filesize_match(args.input, args.output):
            randomize_bin(args.input, args.output, True)