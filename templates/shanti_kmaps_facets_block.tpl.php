<?php
/**
 * @file
 * kmaps_facet_block.tpl.php
 * 
 * Template for creating a fancytree navigable facet block for search flyouts
 * 
 */
?>

<div id="kmaps-facets-block-<?php print $delta; ?>" class="<?php print $classes; ?>"<?php print $attributes; ?>>
  <div class="content"<?php print $content_attributes; ?>>
    <div id="kmtree-<?php echo $delta; ?>" 
					data-delta="<?php echo $delta; ?>" 
					data-kmtype="<?php echo $kmtype; ?>" 
					data-kmroot="<?php echo $kmroot; ?>"
					data-kmurl="<?php echo $treeurl; ?>"
					class="kmapfacettree <?php print $classes; ?>">
		<!-- Content created through Fancytree JS using kmtype and kmroot. See kmaps_facet.js. -->
		</div>
  </div>
</div>
