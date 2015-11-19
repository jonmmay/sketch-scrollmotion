# sketch-scrollmotion
A plugin for Sketch to export designs as a ScrollMotion applet.

#### BEWARE. This is experimental and is in no way supported by ScrollMotion. Use at your own risk: save often, keep backups of your files, and think about what you will do with all the time you've rediscovered.

## Installation
You can [Download Zip](https://github.com/jonmmay/sketch-scrollmotion/archive/master.zip) to the right and double-click on the .sketchplugin file to install.

## How to use it
* Run this plugin from the Plugins menu or by using the `Control + S` hotkey to export your layers as overlays in an applet
  * All layers are exported as image or text overlay. Additional overlay types are supported using a set of specific identifiers
  * Artboards are exported as pages within a single pageset
  * Images will be named based on the layer name and will be exported at @1x and @2x for retina devices
  * The plugin will request the location of custom fonts but will default to "Arial" for missing fonts
* The resulting applet (exported folder of files) will be saved in the same directory of your Sketch file
* Simply zip the applet folder, change the file extension from `zip` to `scrollmotiontransit` and upload into your WorkCloud account
* Publish your applet or make it more awesome using SmartStudio!

## Get interactive

### Buttons
* Identify a Group layer as a button with touch states by appending `[btn]` to the layer name

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Basic%20Button.gif?raw=true "Basic Button")

![alt text](https://raw.githubusercontent.com/jonmmay/sketch-scrollmotion/master/Basic%20Button%20Toggle.gif "Basic Button with toggle")

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Image%20Button.gif?raw=true "Image Button")

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Image%20Button%20Toggle.gif?raw=true "Image Button with toggle")

#### Container
* Identify a Group layer as a scrollable container by appending `[scroll]` to the layer name

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Container.gif?raw=true "Container")

## Ignore layers
* Ignore a layer by appending `-` to the layer name. The plugin will work around the layer so you don't have to delete your art
  * Ignoring a layer will ignore all layers in the layer group
* Flatten a layer by appending `[flat]` to the layer name. The plugin will export all layers in the layer group as a flat bitmap. I'm working on supporting `*` as an alternative.
  * You cannot flatten an Artboard

## Export for SmartStudio
* The exported folder of files will be saved in the same directory of your Sketch file
* Zip the exported folder, change the file extension from `zip` to `scrollmotiontransit` and upload into your SmartStudio account

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Upload.gif?raw=true "Upload to WorkCloud")

## Known issues and shortcomings :(
* Not all Sketch layers are supported. This plugin has not been tested with slice layers, symbols, or text styling
* Not all Sketch layer properties are supported. This plugin has not been tested with transform, rotate, shadows, gaussian blur and other similar properties
* Found fonts are not validated. Be mindful of the fonts that are requested
* Some text properties are not translated to the applet. Underline, super and sub script, text fills, text borders, and transparency are ignored.

I will be squashing these issues and others reported here so stop by often for updates!