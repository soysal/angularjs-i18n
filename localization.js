angular.module('localization', [])
//  create our localization service
.factory
(
	'localize',
	[
		'$http', '$rootScope', '$window',
		function($http, $rootScope, $window)
		{
			var localize =
			{
			//  ##es: path for localization files
				path : '/i18n/',
				
			//  use the $window service to get the language of the user's browser
				language : $window.navigator.userLanguage || $window.navigator.language,

			//  array to hold the localized resource string entries
				dictionary : undefined,

			//  flag to indicate if the service hs loaded the resource file
				resourceFileLoaded : false,

				successCallback : function (data)
				{
				//  store the returned array in the dictionary
					localize.dictionary = data;

				//  set the flag that the resource are loaded
					localize.resourceFileLoaded = true;

				//  broadcast that the file has been loaded
					$rootScope.$broadcast('localizeResourcesUpdates');
				},

				initLocalizedResources : function (fn) //##es add a callback function
				{
				   //  build the url to retrieve the localized resource file
				   //##es use path var
					var url = localize.path + localize.language + '.json';

					//  request the resource file
					$http({ method:"GET", url:url, cache:false })
						.success(function(data){ //## modify to call a custom callback
							localize.successCallback(data);
							if(fn && (typeof fn == 'function')) {fn()}
						})
						.error
					(
						function ()
						{
							//  the request failed set the url to the default resource file
							var url = localize.path + 'default.json';
							//  request the default resource file
							$http({ method:"GET", url:url, cache:false })
								.success(function(data){ //## modify to call a custom callback
									localize.successCallback(data);
									if(fn && (typeof fn == 'function')) {fn()}
								});
							//  TODO what happens if this call fails?
						}
					);
				},

				getLocalizedString : function (value)
				{
				//  default the result to an empty string
					var translated = '!NO TRANSLATION!';

				//  check to see if the resource file has been loaded
					if (!localize.resourceFileLoaded)
					{
					//  call the init method
						localize.initLocalizedResources();
					//  set the flag to keep from looping in init
						localize.resourceFileLoaded = true;
					//  return the empty string
						return translated;
					}

				//  make sure the dictionary has valid data
					if ( typeof localize.dictionary === "object" )
					{
						var log_untranslated = false;
						var placeholders = [];

						for(var i=1; i < arguments.length; i++)
						{
							placeholders.push(arguments[i]);
						}

						var translate = function(value, placeholders)
						{
							var placeholders = placeholders || null;
							var translated = localize.dictionary[value];
							if (translated === undefined)
							{
								if (log_untranslated == true)
								{
									//  Log untranslated value
								}
								//##es sprintf replaced by format function:
								return localize.format(value, placeholders);
							}
							//##es sprintf replaced by format function:
							return localize.format(translated, placeholders);
						};

						var result = translate(value, placeholders);
						if ( (translated !== null) && (translated != undefined) )
						{
							//  set the translated
							translated = result;
						}
					}
					//  add watcher on the item to get the new string
					else
					{

					}

				//  return the value to the call
					return translated;
				} // ##es: reusable replace. required for the directive
				,
				replace: function(elm, str) {
					var tag = localize.getLocalizedString(str);
				//  update the element only if data was returned
					if( (tag !== null) && (tag !== undefined) && (tag !== '') )
					{
					//  insert the text into the element
						//##es elm.append(tag);
						//##es replace the text
						elm.html(tag);
					}
				},
				format: function(value, args) {
					return value.replace(/{(\d+)}/g, 
						function(match, number) {
							return typeof args[number]!='undefined'? args[number]: match;
						}
					);
				}
			};

		//  return the local instance when called
			return localize;
		}
	]
)

.filter
(
	'i18n',
	[
		'localize',
		function (localize)
		{
			return function (input)
			{
				//##es: process filter parameters
				var args = [];
				for(var i=1; i < arguments.length; i++)
				{
					args.push(arguments[i]);
				}
				return localize.getLocalizedString(input, args);
				//##/es
			};
		}
	]
)

.directive
(
	'i18n',
	[
		'localize',
		function(localize)
		{
			return {
				restrict : "EAC",
				link : function (scope, elm, attrs)
				{				
					//##es if the i18n tag exists/has a value, use it, 
					//##es otherwise get the content of element
					//##es this will let us use default values within the tag
					var str = attrs.i18n ? attrs.i18n : elm.html();
					if(!localize.resourceFileLoaded) {
						//## async replacement after the resources are loaded
						localize.initLocalizedResources(function(){
							localize.replace(elm, str);
						});
					}
					localize.replace(elm, str);
					//##/es
				}
			}
		}
	]
);
