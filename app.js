var widgetAPI = new Common.API.Widget(),
    tvKey = new Common.API.TVKeyValue(),
    channelListUrl = 'http://api.lanet.tv/list.json',
    avplay, channels, hlsBaseURL, current, infoTimer, volumeTimer;

function loadChannelList(callback) {
    var channelRequest;
    channelRequest = new XMLHttpRequest();
    channelRequest.onreadystatechange = function () {
        if (channelRequest.readyState === 4 && channelRequest.status === 200) {
            var data = JSON.parse(channelRequest.responseText);
            channels = data['list'];
            hlsBaseURL = data['edge'];
            callback(channelRequest);
        }
    };
    channelRequest.open('GET', channelListUrl, true);
    channelRequest.send();
}

function showInfo(data) {
    clearTimeout(infoTimer);
    var container = document.getElementById('info');
    container.style.visibility = 'visible';
    if (typeof data === 'string') {
        container.innerHTML = data;
    }
    infoTimer = setTimeout(function () {
        container.style.visibility = 'hidden';
    }, 3000);
}

function showVolume() {
    clearTimeout(volumeTimer);
    var container = document.getElementById('volume');
    container.style.color = 'white';
    container.style.visibility = 'visible';
    container.innerHTML = webapis.audiocontrol.getVolume().toString();
    volumeTimer = setTimeout(function () {
        container.style.visibility = 'hidden';
    }, 3000);
}

function showMute() {
    clearTimeout(volumeTimer);
    if (webapis.audiocontrol.getMute()) {
        var container = document.getElementById('volume');
        container.style.color = 'red';
        container.style.visibility = 'visible';
        container.innerHTML = 'MUTE';
    } else {
        showVolume();
    }
}

function play(channel) {
    avplay.stop();
    avplay.open(hlsBaseURL + channel.id.toString() + '.m3u8|COMPONENT=HLS');
    avplay.play(function () {
        showInfo(channel.title);
    }, function (error) {
        console.error(error.message);
    });
}

function onLoad() {
    var body = document.getElementsByTagName('body')[0];
    body.onkeydown = keyDown;
    body.focus();
    widgetAPI.sendReadyEvent();
    loadChannelList(function () {
        if (channels.length > 0) {
            current = 0;
            webapis.avplay.getAVPlay(function (avplayObj) {
                avplay = avplayObj;
                avplayObj.init();
                play(channels[current]);
            });
        } else {
            showInfo(Strings.channelListEmpty);
        }
    });
}

function keyDown() {
    switch (event.keyCode) {
        case tvKey.KEY_RETURN:
            widgetAPI.sendReturnEvent();
            break;
        case tvKey.KEY_CH_DOWN:
            current = current > 0 ? current - 1 : channels.length - 1;
            play(channels[current]);
            break;
        case tvKey.KEY_CH_UP:
            current = current < channels.length - 1 ? current + 1 : 0;
            play(channels[current]);
            break;
        case tvKey.KEY_VOL_UP:
            webapis.audiocontrol.setVolumeUp();
            showVolume();
            break;
        case tvKey.KEY_VOL_DOWN:
            webapis.audiocontrol.setVolumeDown();
            showVolume();
            break;
        case tvKey.KEY_MUTE:
            webapis.audiocontrol.setMute(!webapis.audiocontrol.getMute());
            showMute();
            break;
        case tvKey.KEY_INFO:
            showInfo();
            break;
    }
}

window.onload = function () {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === 'complete') {
            clearInterval(readyStateCheckInterval);
            onLoad();
        }
    }, 10);
};