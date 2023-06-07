## RGBWatermark

RGBWatermark provides strong watermarking protection against AI/machine learning art theft.

This is the standalone version that can be run locally, there is also an online version found here:
https://rgbwatermark.net 

With strong settings, it is impossible to remove. I hope it helps!

![Image](https://github.com/Tenpi/RGBWatermark-GUI/blob/main/assets/images/readme.png?raw=true)

### M1 Macbook

The python commands use x64 versions of the packages, and will error if you have arm64 versions installed. To install
the x64 versions, run this command:

```
sudo arch -x86_64 pip3 install torch pytorch_lightning safetensors onnx --compile --force-reinstall
```

### Related

- [RGBWatermark.net](https://github.com/Tenpi/RGBWatermark.net)
