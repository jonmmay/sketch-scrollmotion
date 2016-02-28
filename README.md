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
* Identify a Group layer as a button with touch states by prepending `[B]` to the layer name. Better yet, select a group layer or many group layers use the plugin command `Edit Button...` to quickly configure your buttons. 

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Basic%20Button.gif?raw=true "Basic Button")

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Image%20Button.gif?raw=true "Image Button")

#### Container
* Identify a Group layer as a scrollable container by prepending `[C]` to the layer name. Or similarly to buttons, use the plugin command `Edit Container...` to make light work of creating containers.

![alt text](https://github.com/jonmmay/sketch-scrollmotion/blob/master/Container.gif?raw=true "Container")

## Ignore layers
* Ignore a layer by prepending `-` to the layer name. The plugin will work around the layer so you don't have to delete your art
  * Ignoring a layer will ignore all layers in the layer group
* Flatten a layer by prepending `*` to the layer name. The plugin will export all layers in the layer group as a flat bitmap.
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