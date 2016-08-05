/**
 * Created by ys2n on 10/3/14.
 */
var kmap_facets_loaded = [false, false, false];
(function ($) {
	
/* $.fn.overlayMask function moved to shanti-sarvaka/shanti-main.js  */
	
  Drupal.behaviorsshanti_kmaps_facets = {
    attach: function (context, settings) {
        // If facet info is set because page is show facet results open the search flyout to that tab
       if (Drupal.settingsshanti_kmaps_facets.facet_info) {
           for (var n in Drupal.settingsshanti_kmaps_facets.facet_info) {
               if (Drupal.settingsshanti_kmaps_facets.facet_info[n] > 0) {
                   var cl = "." + n.replace('block', 'kmaps-facets'); // turn block-1 into .kmaps-facets-1
                   var bn = $(cl).prevAll('li').length;
                  shanti_kmaps_facets_load(bn);
                   $(cl + ' a').tab('show');
                   if ( !$('#search-flyout').hasClass("isOpened") ) {
                        $('#search-flyout .flap').click();
                    }
               }
           }
       }
       
       // If facet has just been deleted with have ?fbid={number} with the block number that was being use so it returns with that same tab open
       if (m = window.location.search.match(/fbid=(\d)/)) { 
           var bcl = ".kmaps-facets-" + m[1]; 
           var bn = $(bcl).prevAll('li').length;
          shanti_kmaps_facets_load(bn);     
           $(bcl + ' a').tab('show');
           if ( !$('#search-flyout').hasClass("isOpened") ) {
                $('#search-flyout .flap').click();
            }
       } 
       
       // When no facets chosen
        // Load First flyout on hover over
        $('#search-flyout .flap.on-flap').hover(function() { 
           shanti_kmaps_facets_load(0); 
         });
         
         // Load second and third flyouts on when hover over tab
         $('#search-flyout li.km-facet-tab').hover(function() { 
             var n = $(this).prevAll('li').length;
            shanti_kmaps_facets_load(n); 
                  
            $('.fancytree-hide').parent('li').hide(); // hide the li parent of hidden nodes.
              console.log('here 2');
         });
         /*
         $('#search-flyout li.kmaps-facets-2 a').hover(function() { 
           shanti_kmaps_facets_load(2); 
         });
         
         // Add clicks for backup.
         $('#search-flyout li.kmaps-facets-1 a').click(function() { 
           shanti_kmaps_facets_load(1); 
         });
         $('#search-flyout li.kmaps-facets-2 a').click(function() { 
           shanti_kmaps_facets_load(2); 
         });*/
         
         // Initialize the search flyout
        $('#search-flyout').once('fancytree', function () {
        		
            // search min length
            const SEARCH_MIN_LENGTH = 2;
            
            if ($('.kmapfacettree').length == 0 ) { console.error("No tree div to apply fancytree too");  }
            
            $('.advanced-link').click(function () {
                $(this).toggleClass("show-advanced", 'fast');
                $(".advanced-view").slideToggle('fast');
                $(".advanced-view").toggleClass("show-options");
                $(".view-wrap").toggleClass("short-wrap"); // ----- toggle class for managing view-section height
            });

            $("#searchbutton").on('click', function () {
                // console.log("triggering doSearch!");
                $("#searchform").trigger('doSearch');
            });

            $('#searchform').attr('autocomplete', 'off'); // turn off browser autocomplete

			var searchUtil = {
			    clearSearch: function () {
			        //        console.log("BANG: searchUtil.clearSearch()");
			        if ($('#tree').fancytree('getActiveNode')) {
			            $('#tree').fancytree('getActiveNode').setActive(false);
			        }
			        $('#tree').fancytree('getTree').clearFilter();
			        $('#tree').fancytree("getRootNode").visit(function (node) {
			            node.setExpanded(false);
			        });
			        //        $('div.listview div div.table-responsive table.table-results').dataTable().fnDestroy();
			
			
			        $('div.listview div div.table-responsive table.table-results tr').not(':first').remove();
			        //        $('div.listview div div.table-responsive table.table-results').dataTable();
			
			        // "unwrap" the <mark>ed text
			        $('span.fancytree-title').each(
			            function () {
			                $(this).text($(this).text());
			            }
			        );
			
			    }
			};
			
			var notify = {
			    warn: function (warnid, warnhtml) {
			        var wonk = function () {
			            if ($('div#' + warnid).length) {
			                $('div#' + warnid).fadeIn();
			            } else {
			                jQuery('<div id="' + warnid + '" class="alert alert-danger fade in"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>' + warnhtml + '</div>').fadeIn().appendTo('#notification-wrapper');
			            }
			        };
			
			        if ($('#notification-wrapper div#' + warnid).length) {
			            $('#notification-wrapper div#' + warnid).fadeOut('slow', wonk);
			        } else {
			            wonk();
			        }
			    },
			
			    clear: function (warnid) {
			
			        if (warnid) {
			            $('#notification-wrapper div#' + warnid).fadeOut('slow').remove();
			        } else {
			            $('#notification-wrapper div').fadeOut('slow').remove();
			        }
			    }
			};
			
			
			// SOLR AJAX
			// Adding all the "widgets" to the manager and attaching them to dom elements.
			// TODO: Not currently used in Kmaps Facets, but still defined. Need to assess and use or remove.
			var Manager;
			
			// Variables from above, now only used in "deprecated" Solr Manager
			var theType = Drupal.settingsshanti_kmaps_facets.block_1_type;
			var Settings = {
			    type: theType,
			    baseUrl: 'http://' + theType + '.kmaps.virginia.edu',
			    mmsUrl: "http://mms.thlib.org",
			    placesUrl: "http://places.kmaps.virginia.edu", // TODO: These should come from the kmaps admin settings
			    subjectsUrl: "http://subjects.kmaps.virginia.edu",
			    mediabaseURL: "http://mediabase.drupal-test.shanti.virginia.edu" // TODO: Is this necessary? Make a setting?
			};
			
			$(function () {
			
			    AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
			
			        afterRequest: function () {
			            $(this.target).empty();
			            var header = (location.pathname.indexOf('subjects') !== -1) ? "<th>Name</th><th>Root Category</th>" : "<th>Name</th><th>Feature Type</th>";
			            $(this.target).append('<thead><tr>' + header + '</tr></thead>');
			            var body = $(this.target).append('<tbody></tbody>');
			            for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
			                var doc = this.manager.response.response.docs[i];
			                body.append(this.template(doc));
			            }
			            $(this.target).find('tr').popover(
			                {
			                    trigger: 'hover',
			                    placement: 'left',
			                    delay: {hide: 5},
			                    container: 'body',
			                    "template": '<div class="popover search-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
			                }
			            );
			
			            $(this.target).on('click', 'tr', function (event) {
			                var kid = $(event.target).closest('td').attr('kid') || $($(event.target).find('td')[0]).attr('kid');
			                $('.row_selected').removeClass('row_selected');
			                $(event.target).closest('tr').addClass('row_selected');
			                $("#tree").animate({scrollTop: 0}, "slow");
			                $("#tree").fancytree('getTree').activateKey(kid);
			            });
			
			            var txt = $('#searchform').val();
			            // trunk8 as needed.  REALLY there should be one place for adding trunk8 on changes
			            //$("table.table-results tbody td span").highlight(txt, {element: 'mark'}).trunk8({tooltip: false});
			        },
			
			        template: function (doc) {
			            var snippet = '';
			            if (doc.header.length > 300) {
			                snippet += doc.header.substring(0, 300);
			                snippet += '<span style="display:none;">' + doc.header.substring(300);
			                snippet += '</span> <a href="#" class="more">more</a>';
			            }
			            else {
			                snippet += doc.header;
			            }
			
			            var path = "<div class='kmap-path'>/" + $.makeArray(doc.ancestors.map(function (x) {
			                    return x;
			                })).join("/") + "</div>";
			            var caption = ((doc.caption_eng) ? doc.caption_eng : "");
			            var localid = doc.id.replace('subjects-', '').replace('places-', ''); // shave the kmaps name from the id.
			            var kmapid = "<span class='kmapid-display'>" + localid + "</span>";
			            var lazycounts = "<div class='counts-display'>" +
			                "<span class='assoc-resources-loading'>loading...</span>" +
			                "<span style='display: none;' class='associated'><i class='icon shanticon-audio-video'></i><span class='badge alert-success'>0</span></span>" +
			                "<span style='display: none;' class='associated'><i class='icon shanticon-photos'></i><span class='badge alert-success'>0</span></span>" +
			                "<span style='display: none;' class='associated'><i class='icon shanticon-places'></i><span class='badge alert-success'>0</span></span>" +
			                "<span style='display: none;' class='associated'><i class='icon shanticon-texts'></i><span class='badge alert-success'>0</span></span>" +
			                "<span style='display: none;' class='associated'><i class='icon shanticon-subjects'></i><span class='badge alert-success'>0</span></span>" +
			                "</div>";
			            var content = path + caption + "<div class='info-wrap' id='infowrap" + localid + "'>" + lazycounts + "</div>";
			            var title = doc.header + kmapid;
			            var info = (doc.feature_types) ? doc.feature_types[0] : doc.ancestors[0];
			
			            var output = '<tr id="ajax-tr-id-' + localid + '" >';
			            output += '<td kid="'+ localid +'"><span>' + doc.header + ' </span></td>';
			            output += '<td id="links_' + localid + '" kid="' + localid + '" class="links"><span>' + info + '</span></td>';
			            output += '</tr>';
			
			            var elem = $(output);
			            
			            // This whole function is not, I believe, currently used. Setting Type to default Subjects. (ndg)
			            // TODO: Use this code or remove
			            var theType = 'subjects';
			            decorateElementWithPopover(elem, localid, theType, doc.header, $.makeArray(doc.ancestors.map(function (x) {
			                return x;
			            })).join("/"), caption);
			            decorateElemWithDrupalAjax(elem,localid,theType);
			            $(elem).on('click',function() {$(elem).trigger('navigate');});
			            return elem;
			        }
			    });
			
			
			    var termidx = Drupal.settings.shanti_kmaps_admin.shanti_kmaps_admin_server_solr_term;
			
			    if (!termidx) {
			        termidx = Drupal.settings.shanti_kmaps_admin.shanti_kmaps_admin_server_solr;
			        termidx = termidx.replace(/kmindex/, 'termindex');
			    }
			
			    if (!termidx) {
			        termidx = 'http://kidx.shanti.virginia.edu/solr/termindex-dev';
			    }
			
			    Settings.type = (Drupal.settings.kmaps_explorer) ? Drupal.settings.kmaps_explorer.app : "places";
			    
			    Manager = new AjaxSolr.Manager({
			        solrUrl: termidx + "/"
			    });
			
			    // alert("adding widget!");
			    Manager.addWidget(new AjaxSolr.ResultWidget({
			        id: 'result',
			        target: 'div.listview div div.table-responsive table.table-results'
			    }));
			
			    Manager.addWidget(new AjaxSolr.TextWidget({
			        id: 'textsearch',
			        target: '#searchform',
			        notify: notify
			    }));
			
			    Manager.init();
			    Manager.store.addByValue('rows', 10);
			    Manager.store.addByValue('q', 'name:*');
			    Manager.store.addByValue('fq', 'tree:' + Settings.type);
			    Manager.store.addByValue('sort', 'header asc');
			    Manager.store.addByValue('df', 'name');
			    // Manager.doRequest();
			
			    Manager.addWidget(new AjaxSolr.PagerWidget({
			        id: 'pager',
			        target: '#pager',
			        prevLabel: '&laquo;',
			        nextLabel: '&raquo;',
			        innerWindow: 1,
			        outerWindow: 0,
			        renderHeader: function (perPage, offset, total) {
			            $('#pager-header').html($('<span></span>').text('displaying ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total));
			        }
			    }));
			
			    Manager.addWidget(new AjaxSolr.FancyTreeUpdatingWidget({
			        id: 'fancytree',
			        target: '#tree'
			    }));
			
			});
			var kms = $("#searchform"); // the main search input
			$(kms).data("holder", $(kms).attr("placeholder"));
			
			// --- features inputs - focusin / focusout
			$(kms).focusin(function () {
			    $(kms).attr("placeholder", "");
			    $("button.searchreset").show("fast");
			});
			$(kms).focusout(function () {
			    $(kms).attr("placeholder", $(kms).data("holder"));
			    $("button.searchreset").hide();
			
			    var str = "Enter Search...";
			    var txt = $(kms).val();
			
			    if (str.indexOf(txt) > -1) {
			        $("button.searchreset").hide();
			        return true;
			    } else {
			        $("button.searchreset").show(100);
			        return false;
			    }
			});
			// --- close and clear all
			$("button.searchreset").click(function () {
			    $(kms).attr("placeholder", $(kms).data("holder"));
			    $("button.searchreset").hide();
			    $(".alert").hide();
			    //    console.log("clearFilter()");
			    searchUtil.clearSearch();
			    $('#tree').fancytree("getTree").clearFilter();
			
			});
			// If there is a error node in fancytree.  Then you can click it to retry.
			$('#tree').on('click', '.fancytree-statusnode-error', function () {
			    $('#tree').fancytree();
			});
			
			// iCheck fixup -- added by gketuma
			$('nav li.form-group input[name=option2]').on('ifChecked', function (e) {
			    var newSource = Settings.baseUrl + "/features/fancy_nested.json?view_code=" + $('nav li.form-group input[name=option2]:checked').val();
			    $("#tree").fancytree("option", "source.url", newSource);
			});
			
			// kludge, to prevent regular form submission.
			$('#kmaps-search form').on('submit', function (event, target) {
			    event.preventDefault();
			    return false;
			});
       }); // end of once
        
    }//end of attach
  };
  
  
	functionshanti_kmaps_facets_load(n) {
		if (n == "undefined" || isNaN(n) || kmap_facets_loaded[n]) { return;}
        kmap_facets_loaded[n] = true;
        // Kludge: Use the presence of fancy tree class with 'ext-filter' to determine fancytree has loaded and then hide <li> with no visible content.
        Drupal.settings.kfintct = 0;
        Drupal.settings.kfint = setInterval(function() {
            if ($(".kmapfacettree").eq(n).attr('class').indexOf('ext-filter') > -1) {
                $('.fancytree-hide').parent('li').hide();
                window.clearInterval(Drupal.settings.kfint );
            } else {
                Drupal.settings.kfintct++;
                if (Drupal.settings.kfintct > 20) {
                    window.clearInterval(Drupal.settings.kfint );
                }
            }
        }, 500);
        
        //console.log("loading facet block " + n);
		$(".kmapfacettree").eq(n).each(function() {
        	  	var me = $(this);
        	  	var delta = $(this).data('delta');
        	    var kmtype = $(this).data('kmtype');
        	    var kmserver = Drupal.settings.shanti_kmaps_admin['shanti_kmaps_admin_server_' + kmtype];
        	    var kmroot = $(this).data('kmroot');
        	    if (kmroot != '') { kmroot = kmroot + '/'; }
        	    var kmdataurl = $(this).data("kmurl");

        	  	$(this).fancytree({
        	      extensions: ["filter", "glyph"],
        	      checkbox: false,
        	      selectMode: 2,
        	      theme: 'bootstrap',
        	      debugLevel: 1,
        	      // autoScroll: true,
        	      autoScroll: false,
        	      filter: {
        	          mode: "hide",
        	          leavesOnly: false
        	      },
        	      activate: function (event, data) {
        	          kmtype = $(this).data('kmtype');
        	          // event.preventDefault();
        	          var listitem = $("td[kid='" + data.node.key + "']");
        	          $('.row_selected').removeClass('row_selected');
        	          $(listitem).closest('tr').addClass('row_selected');
        	          
        						var delta = $(this).data('delta');
        						var url = Drupal.settings.basePath + 'kmaps/facets/' + delta + '/' + data.node.key; // Path for gallery defined in .module document
        						window.location.href = url;
        						/**
        	          var url = location.origin + location.pathname.substring(0, location.pathname.indexOf(kmtype)) + kmtype + '/' + data.node.key + '/overview/nojs';
        	          $(data.node.span).find('#ajax-id-' + data.node.key).trigger('navigate');
        	          */
        	      },
        	      createNode: function (event, data) {
        	          //console.log("createNode: " + data.node.span)
        	          //console.dir(data);
        	
        	          data.node.span.childNodes[2].innerHTML = '<span id="ajax-id-' + data.node.key + '">' + data.node.title + '</span>';
        	
        	          //console.log("STATUS NODE: " + data.node.isStatusNode());
        	          //data.node.span.childNodes[2].innerHTML = '<span id="ajax-id-' + data.node.key + '">' + data.node.title + '</span>';
        	          var path = $.makeArray(data.node.getParentList(false, true).map(function (x) {
        	          		var ptitle = x.title;
        	          		if (m = ptitle.match(/([^\(]+)\(\d+\)/)) { ptitle = m[1]; }
        	              return ptitle;
        	          })).join("/");
        	
        	          var theElem = data.node.span;
        	          var theKey = data.node.key;
        	          var theType = $(this).data('kmtype');
        	          var theTitle = data.node.title;
        	          var theCaption = data.node.data.caption;
        	
        	          decorateElementWithPopover(theElem, theKey, theType, theTitle, path, theCaption );
        	          decorateElemWithDrupalAjax(theElem, theKey, theType);
        	
        	          return data;
        	      },
        	      renderNode: function (event, data) {
        	          data.node.span.childNodes[2].innerHTML = '<span id="ajax-id-' + data.node.key + '">' + data.node.title + '</span>';
        	          return data;
        	      },
        	      glyph: {
        	          map: {
        	              doc: "",
        	              docOpen: "",
        	              error: "glyphicon glyphicon-warning-sign",
        	              expanderClosed: "glyphicon glyphicon-plus-sign",
        	              expanderLazy: "glyphicon glyphicon-plus-sign",
        	              // expanderLazy: "glyphicon glyphicon-expand",
        	              expanderOpen: "glyphicon glyphicon-minus-sign",
        	              // expanderOpen: "glyphicon glyphicon-collapse-down",
        	              folder: "",
        	              folderOpen: "",
        	              loading: "glyphicon glyphicon-refresh"
        	              //              loading: "icon-spinner icon-spin"
        	          }
        	      },
        	      source: {
        	          url: kmdataurl, //?view_code=" + $('nav li.form-group input[name=option2]:checked').val(),
        	          cache: false,
        	          debugDelay: 1000,
        	          timeout: 90000,
        	          error: function (e) {
        	              notify.warn("networkerror", "Error retrieving tree from kmaps server. Error: " + e.message);
        	          },
        	          beforeSend: function () {
        	              maskSearchResults(me, true);
        	              //console.log(kmserver + "/features/" + kmroot + "fancy_nested.json"); //+ $('nav li.form-group input[name=option2]:checked').val());
        	          },
        	          complete: function () {
        	            // (false);
        	            maskSearchResults(me, false);
        	          }
        	      },
        	      focus: function (event, data) {
        	          data.node.scrollIntoView(true);
        	      },
        	      create: function(evt,ctx) {
        	          //console.log("EVENT: Create");
        	          //console.dir(evt);
        	          //console.dir(ctx);
        	      },
        	
        	      loadChildren: function(evt,ctx) {
        					var startId = 'ajax-id-' + $(this).data('kmroot');
        					var delta = $(this).data('delta');
        					if (startId) {
        	            var startNode = ctx.tree.getRootNode();
        	            if (startNode) {
        	                try {
        	                    startNode.children[0].setExpanded(true);
        	                    startNode.children[0].makeVisible();
        	                } catch( e ) { 
        	                	console.error ("autoExpand failed", e) ;
        	                }
        	            }
        	         }
        	         // Do not filter tree if view is empty
        	         var kid = (typeof(Drupal.settingsshanti_kmaps_facets.filter_kid) == 'undefined') ? false : Drupal.settingsshanti_kmaps_facets.filter_kid;
        	         if ($('.view-empty').length == 1) { 
        	         	if (kid) {
        	         		kid = kid + "";
        	         		ctx.tree.getNodeByKey(kid).setExpanded(true);
        	         		var myel = document.getElementById('ajax-id-' + kid);
        	         		var treediv = $('#kmtree-' + delta);
        	         		var eloffset = $(myel).offset().top;
        	         		var treeoffset = treediv.offset().top;
        	         		treediv.scrollTop(eloffset - treeoffset - 10);
        	         	}
        	         	return; 
        	         } // end of empty view
        	         
        	         // Tree filtering based on selection
        	         if (typeof(Drupal.settingsshanti_kmaps_facets.facet_info) != "undefined") {
            	         var delta = ctx.tree.data.delta;
            	         var fkid = (Drupal.settingsshanti_kmaps_facets.facet_info["block-" + delta] == 0) ? false : Drupal.settingsshanti_kmaps_facets.facet_info["block-" + delta];
            	         var fdata = JSON.parse(Drupal.settingsshanti_kmaps_facets["block_" + delta + "_data"]);
            	         // Filter tree in block based on that blocks facet data saved as a Drupal JSON setting
            	         //console.log('tree', ctx.tree);
            	         ctx.tree.filterNodes(function(node) {
            	            	var kid = node.key;
            	            	if (kid in fdata) {
            	            		hct = fdata[kid].length;
            	            		// Map object to array so it can be counted (should be used)
            	            		if (typeof(fdata[kid]) == "object") {
            	            			var farray = jQuery.map(fdata[kid], function(val, ind) { return [val];});
            	            			hct = farray.length;
            	            		}
            	            		node.data.hitct = hct;
            	            		node.title = node.title +  " (" + hct + ")";
            	            		if (kid == fkid) {
            	            		         var bid = ctx.tree.$container.parents('.kmaps-facets-block').attr('id').replace('kmtree-','');
            	            				node.title = node.title + ' <a href="' + Drupal.settings.basePath + '?fbid=' + bid + '" class="facet-remove">' +
            	            				'<span class="icon shanticon-cancel"></span></a>';
            	            		}
            	            		return true;
            	            	}
            	            	return false;
            	         });
            	         if (!fkid) {
            	         	   // With no facet collapse tree to immediate children of root child
            	             var troot = ctx.tree.getFirstChild();
            	             troot.visit(function(node) {  node.setExpanded(false); });
            	         }
            	     } else { console.warn("No facet info set inshanti_kmaps_facets.js"); }
        	      },
        	      cookieId: "kmaps" + $(this).data('delta') + "tree", // set cookies for search-browse tree
        	      idPrefix: "kmaps" + $(this).data('delta') + "tree"
	 		}); // End of .fancytree();
		}); // End of each         
	}

	function maskSearchResults(self, isMasked) {
	    var showhide = (isMasked) ? 'show' : 'hide';
	    $(self).overlayMask(showhide);
	}
	
	function maskTree(isMasked) {
	    var showhide = (isMasked) ? 'show' : 'hide';
	    $('.kmapfacettree').overlayMask(showhide);
	}
	
	function decorateElementWithPopover(elem, key, kmtype, title, path, caption) {
	    var kmserver = Drupal.settings.shanti_kmaps_admin['shanti_kmaps_admin_server_' + kmtype];
	    if (jQuery(elem).popover) {
	        jQuery(elem).attr('rel', 'popover');
	        jQuery(elem).popover({
	                html: true,
	                content: function () {
	                    var caption = ((caption) ? caption : "");
	                    var popover = "<div class='kmap-path'>/" + path + "</div>" + caption +
	                        "<div class='info-wrap' id='infowrap" + key + "'><div class='counts-display'>...</div></div>";
	                    return popover;
	                },
	                title: function () {
	                    return title + "<span class='kmapid-display'>" + key + "</span>";
	                },
	                trigger: 'hover',
	                placement: 'left',
	                delay: {hide: 5},
	                container: 'body'
	            }
	        );
	
	        jQuery(elem).on('shown.bs.popover', function (x) {
	            $("body > .popover").removeClass("related-resources-popover"); // target css styles on search tree popups
	            $("body > .popover").addClass("search-popover"); // target css styles on search tree popups
	
	            var countsElem = $("#infowrap" + key + " .counts-display");
	
	            // highlight matching text (if/where they occur).
	            var txt = $('#searchform').val();
	            //$('.popover-caption').highlight(txt, {element: 'mark'});
							var kmtype = $(elem).parents('.kmapfacettree').data('kmtype');
							var kmserver = Drupal.settings.shanti_kmaps_admin['shanti_kmaps_admin_server_' + kmtype];
	            $.ajax({
	                type: "GET",
	                url: kmserver + "/features/" + key + ".xml",
	                dataType: "xml",
	                timeout: 90000,
	                kmtype: kmtype,
	                kmkey: key,
	                beforeSend: function () {
	                    countsElem.html("<span class='assoc-resources-loading'>loading...</span>");
	                },
	                error: function (e) {
	                    countsElem.html("<i class='glyphicon glyphicon-warning-sign' title='" + e.statusText);
	                },
	                success: function (xml) {
	                    //Settings.type = (Drupal.settings.kmaps_explorer) ? Drupal.settings.kmaps_explorer.app : "places";
	
	                    // force the counts to be evaluated as numbers.
	                    var related_count = Number($(xml).find('related_feature_count').text());
	                    var description_count =  Number($(xml).find('description_count').text());
	                    var place_count =  Number($(xml).find('place_count').text());
	                    var picture_count = Number($(xml).find('picture_count').text());
	                    var video_count = Number($(xml).find('video_count').text());
	                    var document_count = Number($(xml).find('document_count').text());
	                    var subject_count = Number($(xml).find('subject_count').text());
	
	                    if (kmtype === "places") {
	                        place_count = related_count;
	                    } else if (kmtype === "subjects") {
	                        subject_count = related_count;
	                    }
	                    countsElem.html("");
	                    countsElem.append("<span style='display: none' class='associated'><i class='icon shanticon-audio-video'></i><span class='badge' >" + video_count + "</span></span>");
	                    countsElem.append("<span style='display: none' class='associated'><i class='icon shanticon-photos'></i><span class='badge' >" + picture_count + "</span></span>");
	                    countsElem.append("<span style='display: none' class='associated'><i class='icon shanticon-places'></i><span class='badge' >" + place_count + "</span></span>");
	                    countsElem.append("<span style='display: none' class='associated'><i class='icon shanticon-subjects'></i><span class='badge' >" + subject_count + "</span></span>");
	                    countsElem.append("<span style='display: none' class='associated'><i class='icon shanticon-texts'></i><span class='badge' >" + description_count + "</span></span>");
	
	                },
	                complete: function () {
	                    var fq = Drupal.settings.shanti_kmaps_admin.shanti_kmaps_admin_solr_filter_query;
	
	                    var project_filter = (fq)?("&" + fq):"";
	                    var kmidxBase = Drupal.settings.shanti_kmaps_admin.shanti_kmaps_admin_server_solr;
	                    if (!kmidxBase) {
	                        kmidxBase = 'http://kidx.shanti.virginia.edu/solr/kmindex';
	                        console.error("Drupal.settings.shanti_kmaps_admin.shanti_kmaps_admin_server_solr not defined. using default value: " + kmidxBase);
	                    }
	                    var solrURL = kmidxBase + '/select?q=kmapid:' + this.kmtype + '-' + this.kmkey + project_filter + '&start=0&facets=on&group=true&group.field=asset_type&group.facet=true&group.ngroups=true&group.limit=0&wt=json';
	                    // console.log ("solrURL = " + solrURL);
	                    $.get(solrURL, function (json) {
	                        //console.log(json);
	                        var updates = {};
	                        var data = JSON.parse(json);
	                        $.each(data.grouped.asset_type.groups, function (x, y) {
	                            var asset_type = y.groupValue;
	                            var asset_count = y.doclist.numFound;
	                            updates[asset_type] = asset_count;
	                        });
	                        // console.log(key + "(" + title + ") : " + JSON.stringify(updates));
	                        update_counts(countsElem, updates);
	                    });
	                }
	            });
	        });
	    }
	
	
	    function update_counts(elem, counts) {
	
	        var av = elem.find('i.shanticon-audio-video ~ span.badge');
	        if (typeof(counts["audio-video"]) != "undefined") {
	            (counts["audio-video"]) ? av.html(counts["audio-video"]).parent().show() : av.parent().hide();
	        }
	        if (Number(av.text()) > 0) {
	            av.parent().show();
	        }
	
	        var photos = elem.find('i.shanticon-photos ~ span.badge');
	        if (typeof(counts.photos) != "undefined") {
	            photos.html(counts.photos);
	        }
	        (Number(photos.text()) > 0) ? photos.parent().show() : photos.parent().hide();
	
	        var places = elem.find('i.shanticon-places ~ span.badge');
	        if (typeof(counts.places) != "undefined") {
	            places.html(counts.places);
	        }
	        if (Number(places.text()) > 0) {
	            places.parent().show();
	        }
	
	        var essays = elem.find('i.shanticon-texts ~ span.badge');
	        if (typeof(counts.texts) != "undefined") {
	            essays.html(counts["texts"]);
	        }
	        if (Number(essays.text()) > 0) {
	            essays.parent().show();
	        }
	
	        var subjects = elem.find('i.shanticon-subjects ~ span.badge');
	        if (typeof(counts.subjects) != "undefined") {
	            subjects.html(counts.subjects);
	        }
	        if (Number(subjects.text()) > 0) {
	            subjects.parent().show();
	        }
	        elem.find('.assoc-resources-loading').hide();
	
	    }
	
	
	    return elem;
	};
	
	function decorateElemWithDrupalAjax(theElem, theKey, theType) {
	    //console.log("decorateElementWithDrupalAjax: "  + $(theElem).html());
	    $(theElem).once('nav', function () {
	        //console.log("applying click handling to " + $(this).html());
	        var base = $(this).attr('id') || "ajax-wax-" + theKey;
	        var argument = $(this).attr('argument');
	        var url = location.origin + location.pathname.substring(0, location.pathname.indexOf(theType)) + theType + '/' + theKey + '/overview/nojs';
	
	        var element_settings = {
	            url: url,
	            event:  'navigate',
	            progress: {
	                type: 'throbber'
	            }
	        };
	        // console.log("Adding to ajax to " + base);
	        Drupal.ajax[base] = new Drupal.ajax(base, this, element_settings);
	        //this.click(function () {
	        //    console.log("pushing state for " + url);
	        //    window.history.pushState({tag: true}, null, url);
	        //});
	    });
	};
	
})(jQuery);
