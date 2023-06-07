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
import random

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

def shift_list(arr, shift, probability):
    if isinstance(arr, float | int):
        if random.random() < float(probability):
                if random.random() < 0.5:
                    arr += float(shift)
                else:
                    arr -= float(shift)
    else:
        for i in range(len(arr)):
            if type(arr[i]) is list:
                return shift_list(arr[i], shift, probability)
            if random.random() < float(probability):
                if random.random() < 0.5:
                    arr[i] += float(shift)
                else:
                    arr[i] -= float(shift)

def shift_tensor(tensor, shift, probability):
    if random.random() < float(probability):
                if random.random() < 0.5:
                    tensor = tensor.add(float(shift))
                else:
                    tensor = tensor.add(-float(shift))
    return tensor

def shift_array(array, shift, probability):
    if random.random() < float(probability):
                if random.random() < 0.5:
                    array = numpy.add(array, float(shift))
                else:
                    array = numpy.add(array, -float(shift))
    return array

def shift_ckpt(input, output, shift, probability, half = False):
    model = torch.load(input, map_location=device)
    state_dict = model["state_dict"]
    for key in state_dict.keys():
        if key == "state_dict":
            continue
        size = state_dict[key].size()
        if half:
            state_dict[key] = shift_tensor(state_dict[key], shift, probability).half()
        else:
            state_dict[key] = shift_tensor(state_dict[key], shift, probability)
    torch.save(model, output)

def shift_safetensors(input, output, shift, probability, half = True):
    model = safe_open(input, framework="pt")
    tensors = {}
    for key in model.keys():
        size = model.get_tensor(key).size()
        if half:
            tensors[key] = shift_tensor(model.get_tensor(key), shift, probability).half()
        else:
            tensors[key] = shift_tensor(model.get_tensor(key), shift, probability)
    save_file(tensors, output)

def shift_pt(input, output, shift, probability, half = False):
    model = torch.load(input, map_location=device)

    # VAE
    if "state_dict" in model:
        state_dict = model["state_dict"]
        for key in state_dict.keys():
            if key == "state_dict":
                continue
            size = state_dict[key].size()
            if half:
                state_dict[key] = shift_tensor(state_dict[key], shift, probability).half()
            else:
                state_dict[key] = shift_tensor(state_dict[key], shift, probability)
    
    # Hypernetwork
    if 768 in model:
        for d in model[768]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = shift_tensor(d[key], shift, probability).half() if half else shift_tensor(d[key], shift, probability)
    if 1024 in model:
        for d in model[1024]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = shift_tensor(d[key], shift, probability).half() if half else shift_tensor(d[key], shift, probability)
    if 320 in model:
        for d in model[320]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = shift_tensor(d[key], shift, probability).half() if half else shift_tensor(d[key], shift, probability)
    if 640 in model:
        for d in model[640]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = shift_tensor(d[key], shift, probability).half() if half else shift_tensor(d[key], shift, probability)
    if 1280 in model:
        for d in model[1280]:
            for key, value in d.items():
                size = d[key].size()
                d[key] = shift_tensor(d[key], shift, probability).half() if half else shift_tensor(d[key], shift, probability)
    
    # Textual Inversion
    if "string_to_param" in model:
        for key in model["string_to_param"]:
            size = model["string_to_param"][key].size()
            if half:
                model["string_to_param"][key] = shift_tensor(model["string_to_param"][key], shift, probability).half()
            else:
                model["string_to_param"][key] = shift_tensor(model["string_to_param"][key], shift, probability)
    torch.save(model, output)

def shift_onnx(input, output, shift, probability, half = False):
    model = onnx.load(input)
    for i in range(len(model.graph.initializer)):
        tensor = model.graph.initializer[i]
        weight = onnx.numpy_helper.to_array(tensor)
        shifted = shift_array(weight, shift, probability)
        shifted_tensor = None
        if half:
            shifted_tensor = numpy_helper.from_array(shifted.astype(numpy.float16))
        else:
            shifted_tensor = numpy_helper.from_array(shifted.astype(numpy.float32))
        model.graph.initializer[i].CopyFrom(shifted_tensor)
    onnx.save(model, output)

def shift_bin(input, output, shift, probability, half = False):
    model = torch.load(input, map_location=device)
    for key in model.keys():
        size = model[key].size()
        if half:
            model[key] = shift_tensor(model[key], shift, probability).half()
        else:
            model[key] = shift_tensor(model[key], shift, probability)
    torch.save(model, output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="Network Randomizer")
    parser.add_argument("-i", "--input")
    parser.add_argument("-o", "--output")
    parser.add_argument("-s", "--shift")
    parser.add_argument("-p", "--probability")
    args = parser.parse_args()

    ext = pathlib.Path(args.input).suffix

    if ext == ".ckpt":
        shift_ckpt(args.input, args.output, args.shift, args.probability)
        if not check_filesize_match(args.input, args.output):
            shift_ckpt(args.input, args.output, args.shift, args.probability, True)
    elif ext == ".safetensors":
        shift_safetensors(args.input, args.output, args.shift, args.probability)
        if not check_filesize_match(args.input, args.output):
            shift_safetensors(args.input, args.output, args.shift, args.probability, False)
    elif ext == ".onnx":
        shift_onnx(args.input, args.output, args.shift, args.probability)
        if not check_filesize_match(args.input, args.output):
            shift_onnx(args.input, args.output, args.shift, args.probability, True)
    elif ext == ".pt":
        shift_pt(args.input, args.output, args.shift, args.probability)
        if not check_filesize_match(args.input, args.output):
            shift_pt(args.input, args.output, args.shift, args.probability, True)
    elif ext == ".bin":
        shift_bin(args.input, args.output, args.shift, args.probability)
        if not check_filesize_match(args.input, args.output):
            shift_bin(args.input, args.output, args.shift, args.probability, True)

# 0.001