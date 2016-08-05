Drupal KMaps Facet Module
=============================

A Drupal block module that provides a customizable number of blocks to navigate subject and places in relation to a specific resource type.

Developed for Shanti at UVa (http://shanti.virginia.edu) by Than Grove (ndg8f@virginia.edu)
Based on Kmaps Navigator written by Yuji Shinozaki (ys2n@virginia.edu) and Shanti Kmaps Field module written by Raf Alvarado

This module creates a variable number of blocks. Each block displays either a place or subject tree from a customizable starting point
where each node of the tree shows the number of a specific type of resource tagged with that kmap. In the block configuration, you choose
the type (places/subjects), the root node, and the type of resource to display counts for (e.g. A/V, texts, etc.). The block then dispalys
that portion of the tree with numbers indicating the number of resources (nodes) of chosen type tagged with that kmap.

Blocks are can be placed in any region, however they were primarily intended for the Shanti Sarvaka theme Search Flyout. 
They can be displayed as individual tabs with some modification to the subtheme. To implement this 
see Mediabase's Sarvaka Mediabase theme, especially the sarvaka_mediabase_preprocess_region() function in the template.php file.

## Dependencies
The Facet Module builds on work already done in the Shanti Mandala package. It uses the fancytree and ajaxsolr modules found
in the Kmaps Modules repo (https://github.com/shanti-uva/drupal_kmaps_modules) to display the navigation trees, and the facets
are created from Shanti Kmaps Fields (https://github.com/shanti-uva/drupal_shanti_kmaps_fields). At present (Aug. 2015), a slightly
modified version Shanti Kmaps fields *MUST* be used, namely the branch called "AV-MANU-19". It also relies on the Shanti Kmaps 
Admin module (https://github.com/shanti-uva/drupal_shanti_kmaps_admin).

## Usage
First one must have installed the Shanti Kmaps Fields module (branch: AV-MANU-19) on the target Drupal site and created one 
or more Shanti Kmaps fields in one or more of your content types. The same custom field can be duplicated on more than one content type 
by using the "Add Existing Field" option. So use the same field on multiple content types to create a single facet block.

Once the fields are installed, you can set the number of facet blocks available by going to the configuration page for this 
module at ../admin/config/user-interfaceshanti_kmaps_facets or from the admin menu Configuration -> User Interface -> Kmaps Facet 
Settings. This setting determines the number of facet blocks available to you on the blocks admin page. It defaults to 2.

Next go to the block admin page (/admin/structure/block) and you will see a number of Kmaps Facet blocks as defined in the settings
above. Each block will be named "Kmaps Facets 1 (Kmaps Facet)" and so on. Click the "Configure" link for that block and it will 
take you to the block's configuration page, which has the following fields:

### Block Title
This is the header for the facet that appears on the page itself. In the search flyout it appears as the tab name.

### Block Name
This is the administration name for the block that appears on the block admin page. No matter what you enter here, 
it will have "(Kmaps Facet)" appended to it for clarity.

### KMap Tree Type
This allows you to choose the type of Kmap tree you wish to show in the block: subjects or places. (A TODO for the future 
would be to just get this information from the field itself.)

### Kmap Root Node
This is the KMap ID for the root node where you want the tree to begin. In other words, if you pick subjects, you don't have 
to show the whole subject tree. By entering a KMap ID for a particular subject, you can show the tree with that subject 
as the root or top node

### Kmap Facet Field
This drop-down list shows all the Kmap fields added to your site with the content type(s) they are added to in parentheses. 
Choose the field you wish to show in the current block.

Finally, choose the Region Settings as with all Drupal blocks. This module was designed for the blocks to be put in the Shanti 
Sarvaka theme's Search Flyout region without further styling, but it can be used with any theme with some styling adjustments.
