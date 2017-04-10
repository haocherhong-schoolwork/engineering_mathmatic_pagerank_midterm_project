const Util = require('./Util.js');

const ResourceManager = (function(){

	var _requestCount = 0,
		_responseCount = 0, 
		_timeountIDPrevious = 0,
		_timeountID = 0, 
		_intervalID = 0,
		ajaxProcessing = false, 
		_requests = {}, 
		_responsedResource = {}, 
		_subjectFunction = function() {},
		ResourceManager = function() {},
		ResourceManagerIntance = function() {};
	
	var getFinishedRequestPercent = function() {
		return _responseCount / _requestCount * 100;
	};

	var getRequestCount = function() {
		return _requestCount;
	};

	var getResponseCount = function() {
		return _responseCount;
	};

	var loadTiledResources = function(json, baseDirectory) {
		var promises = [];
		for(var tileset of json.tilesets) {
			var match = /([^\.\/]+)\.([^\.]+)$/.exec(tileset.image);
			promises.push(loadImage({
				id: match[1],
				url: baseDirectory + match[1] + '.' + match[2]
			}));
		}
		return Promise.all(promises);
	}

	var loadImage = function(requestOption) {

		if(typeof(requestOption) === 'string')
			requestOption = { url: requestOption };

		if(typeof(requestOption) !== 'object' || typeof(requestOption.url) !== 'string')
			throw new Error('Invalid argument, string or object with url string property expected');

		if(!requestOption.id)
			requestOption.id = requestOption.url;

		return new Promise((resolve, reject)=>{
			//Check if image is already loaded
			if(_responsedResource[requestOption.id]) {
				return resolve(_responsedResource[requestOption.id]. response);
			}

			if(_requests[requestOption.id]) {
				//Image is loading, add event listener
				_requests.image.addEventlistener('load', ()=>{
					resolve(_requests.image);
				})
				return;
			}
			
			console.log('loading ' + requestOption.id + ' (' + requestOption.url + ')...');

			var image = new Image();

	        if(_intervalID === null) {
	            _intervalID = setInterval(detectAjax, 50);
	            finishLoading();
	        }
	        

			image.onload = function() {
				_responseCount++;
		    	_responsedResource[requestOption.id] = { url: requestOption.url, response: image };
		    	console.log(requestOption.id + ' (' + requestOption.url + ') loaded');
		    	delete _requests[requestOption.id];
		    	resolve(image);
		    };
		    image.onerror = reject;

		    //start loading
			image.src = requestOption['url'];
			_requestCount++;
			_requests[requestOption.id] = {
				id: requestOption.id,
				url: requestOption.url,
				image
			};
		})
	};

	var minAjaxJSON = function(requestOption) {
		requestOption.systemSuccess = function(responseText, textStatus, xmlHttpRequest) { 
			var responseJSON = eval('(' + responseText.trim() + ')');	//因有可能是不合法的JSON, 故只能用eval了
			_responsedResource[requestOption.id] = { url: requestOption.url, response: responseJSON };	
			_responseCount++;		
		};

		minAjax(requestOption.type, requestOption);	
	};

	var minAjax = function(type, requestOption) {
		var userSettings = userSettings || {};
		userSettings.type = type || 'POST';

		if (!Util.isUndefined(requestOption.data)) {
			userSettings['data'] = requestOption.data;
		}

		if (!Util.isUndefined(requestOption.systemSuccess)) {
			userSettings['success'] = requestOption.systemSuccess;
		}	

		ajax(requestOption, userSettings);
	};

	var ajax = function(requestOption, userSettings) {
		_requestCount++;
		var defaultSettings = {
			type:'POST',
			cache:false,
			async:true,
			contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
			error: function(xmlHttpRequest, textStatus){},
			//data: 'user=admin%20admin&password=12345' //需要自行encode, 且只接受string格式
			statusCode: {
				/*404: function() {},
				500: function() {},*/	//這部分USER可以自行設定
			},
			success: function(data, textStatus, xmlHttpRequest) {},			
		};

		var userSettings = userSettings || defaultSettings;
		userSettings = Util.overrideProperty(defaultSettings, userSettings);
		

		//因IE9後才支援HTML5, 故不再做其他判斷
		if (window.XMLHttpRequest) {
			var xhr = new XMLHttpRequest();
			xhr.onload = (function() {
				if (xhr.readyState === 4) {
    				if (xhr.status === 200) {
    					_responsedResource[requestOption.id] = { url: requestOption.url, response: xhr.responseText }; 
						userSettings.success(xhr.responseText, xhr.statusText, xhr);
    				} else {
    					userSettings.error(xhr, xhr.statusText);
    				}
    			}
			});
		}
		
		if (!userSettings.cache && Util.isUndefined(userSettings.data) && userSettings.type === 'GET') {	
			requestOption.url = requestOption.url + '?' + Math.random();	
		} else if (!Util.isUndefined(userSettings.data) && userSettings.data.trim() !== '') {
			requestOption.url = requestOption.url + '?' + userSettings.data.trim();
		}
		
		xhr.open(userSettings.type, requestOption.url, userSettings.async);	
		xhr.overrideMimeType('text/plain; charset=x-user-defined'); 
		
		if (userSettings.type === 'GET')	{
			xhr.send();
		} else {			
			xhr.setRequestHeader('Content-Type', userSettings.contentType);	
			xhr.send(userSettings.data);
		}		
	};


	var getResource = function(id) {
		if(Util.isUndefined(_responsedResource[id])) {
			throw ('\'' + id + '\' is undefined Resource.');
		}		
		return _responsedResource[id].response;
	};

	var destroyResource = function(id) {
		console.log('destroy request ' + id);
		if(Util.isUndefined(_responsedResource[id])) {
			return;
		}
		console.log('destroy ' + id);
		_responsedResource[id].response = null;
		_responsedResource[id].url = null;
        _responsedResource[id] = null;
		delete _responsedResource[id];
	};

	var setSubjectFunction = function(subjectFunction) {
		_subjectFunction = subjectFunction;
	};

	var detectAjax = function() {
		//Constuctor即開始偵測	
		//要有(_requestCount == 0)是為了避免一開始就去執行gameController.start
		ajaxProcessing = (_requestCount !== _responseCount) || (_requestCount === 0);		
	};

	var stopDetectingAjax = function() {
		clearInterval(_intervalID);
		_intervalID = null;
	};

	var finishLoading = function() {
		//由game來控制遊戲開始的時機, 需要是在發出所有request後, 再call這個funciton
		detectAjax();
		if(!ajaxProcessing) {
			stopDetectingAjax();
			_subjectFunction();
			ajaxProcessing = false;
		} else {
			_timeountIDPrevious = _timeountID;
			_timeountID = setTimeout(function() {  
				finishLoading();
				clearTimeout(_timeountIDPrevious);
			}, 500);
		}
	};
	
	
	ResourceManager = function(subjectFunction) {
		_requestCount = 0;
		_responseCount = 0;
		_responsedResource = {};

		if(!Util.isUndefined(subjectFunction)) {
			_subjectFunction = subjectFunction;
		}

		//_intervalID = setInterval(detectAjax, 50);
		finishLoading();
	};

	//Public
	ResourceManager.prototype = {			
		loadImage: loadImage,
		loadTiledResources: loadTiledResources,
		loadJSON: minAjaxJSON,
		destroyResource: destroyResource,
		getResource: getResource,	
		setSubjectFunction: setSubjectFunction,	
		getFinishedRequestPercent: getFinishedRequestPercent,
		getRequestCount: getRequestCount,
		getResponseCount: getResponseCount,
	};

	ResourceManagerIntance = new ResourceManager();
	return ResourceManagerIntance;	
})();

module.exports = ResourceManager;