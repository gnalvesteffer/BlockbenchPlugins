What this is:

A Blockbench plugin that handles importing and exporting from and to the Vintage Story format. Blockbench has superior tools compared to VSMC. The biggest problem was always that it didn't support the Vintage Story model format. The Formats are similar but still different in a few key aspects. Since Blockbench makes it relatively easy to write plugins for it, I started to code one up that can handle the Vintage Story format. Since the models I tested do seem to work now, I think it is ready for its first run in the wild. There is no all-encompassing definition of the Vintage Story shape format so I probably missed some stuff when testing and I also intentionally skipped over some stuff for now. This is why it is an ALPHA version. Make regular incremental saves when you are using this and report any issues in a way, that enables me to fix them.

How to install:

Super easy: Open Blockbench and select "File->Plugins..." then drag-and-drop the vs_plugin.js  file from the download into the window that opens and you are ready to go.

Basic use:

To make a new Model or open an existing one you need to go to "File->New->Vintage Story Base Format". (If the Format does not show up, the plugin is not installed correctly). In the Wizard select a Name and an  id then press confirm. After that your Project should be created and you can import VS shape files with "File->Import-> Import From VS Format". When you are happy with the model you can export it again with "File->Export->Export into VS Format".

For Blockbench to figure out texture paths on its own from the relative texture paths I added a setting under "File->Preferences->Settings". Under "General" right at the bottom should be a gear icon called "Texture Asset Path". When clicking on it you should be able to select the path to your texture folder. I know that there are 3 different texture folders for the base game already so this isn't the ideal solution yet. That's something I'm not quite sure how I wanna do yet.

Immediate goals:
When importing and reexporting VS models, they should look the same as before although the internal structure of the nodes may have changed a bit.
Attributes that are not directly supported by Blockbench should survive importing and reexporting cycles. One example that I already found is the "windMode" attribute on some round shield faces, but there are probably a lot more that I haven't found so far. If you find one, tell me. It should be an easy fix.
Blockbench should figure out most texture paths from the relative paths in the shape files and correctly load those textures.
Models that are created in Blockbench from scratch should of course also get exported without issues. I haven't really tested this yet.
It should be impossible to export invalid shape files.
Fixing your bugs
Goals I will tackle when the basic stuff works:
Exporting and importing animation data. This is not supported at all at the moment and will probably cost quite a bit of time to get it to work. But I think it would be time well spent.
Make it possible to set important VS-specific attributes from within Blockbench (For example the relative texture paths)
Make use of the ability of Blockbench plugins to disable certain features in a Project and disable the creating of stuff that can't be handled by Vintage Story at all (Arbitrary meshes for example)