String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

String.prototype.injectTo = function(index, inject)
{
    return this.substr(0, index) + inject + this.substr(index+1);
}

/**
 * Created by joona on 06/03/14.
 */
speedReader =
{
    wordQueue : [],
    queueLength : 0,
    queuePosition : 0,
    progress : 0,

    wordsPerMinute : 220,
    intervalId : null,
    reading : false,
    bindedElement : null,

    eventMapping : {},

    on : function(event, callBack)
    {
        var events = event.split(' ');

        for(var i = 0, max = events.length; i < max; i++)
        {
            if ( ! this.eventMapping[events[i]])
            {
                this.eventMapping[events[i]] = new Array();
            }
            this.eventMapping[events[i]].push(callBack);
        }
        return this;
    },

    clearQueue : function()
    {
        this.eventTriggered('clear');
        this.wordQueue = [];
        this.queueLength = 0;
        return this;
    },

    readToQueue : function (text)
    {
        this.eventTriggered('read');
        this.wordQueue = this.wordQueue.concat(this.splitText(text));
        this.queueLength = this.wordQueue.length;
        return this;
    },

    readField : function (elementSelector)
    {
        var htstring = $(elementSelector).val(),
            stripped = htstring.replace(/(<([^>]+)>)/ig,"");
        return this.readToQueue(stripped);
    },

    readElement : function(elementSelector)
    {
        var htstring = $(elementSelector).html(),
            stripped = htstring.replace(/(<([^>]+)>)/ig,"");
        return this.readToQueue(stripped);
    },

    bind : function(elementId)
    {
        this.bindedElement = document.getElementById(elementId);
        return this;
    },

    setSpeed : function(wpm)
    {
        this.eventTriggered('speed-change')
        if (wpm > 1)
        {
            this.wordsPerMinute = wpm;
        }
        if (this.reading)
        {
            this.pause().start();
        }
        return this;
    },

    start : function()
    {
        this.eventTriggered('start');
        this.intervalId = setInterval(
            function(){ speedReader.type(); },
            this.intervalInMilliseconds(this.wordsPerMinute)
        );
        this.reading = true;
        return this;
    },

    togglePlay : function()
    {
        return this.reading ? this.pause() : this.start();
    },

    pause : function()
    {
        clearInterval(this.intervalId);
        this.reading = false;
        this.eventTriggered('pause');
        return this;
    },

    stop : function()
    {
        clearInterval(this.intervalId);
        this.reading = false;
        this.queuePosition = 0;
        this.eventTriggered('stop');
        return this;
    },

    type : function ()
    {
        this.updateProgress();
        if (this.queueLength == this.queuePosition + 1)
        {
            this.stop();
        }
        else
        {
            this.bindedElement.innerHTML = this.wordQueue[this.queuePosition];
        }
        this.queuePosition++
        this.eventTriggered('type');
        return this;
    },

    updateProgress : function()
    {
        if (this.queueLength === 0)
        {
            this.progress = 0;
        }
        else
        {
            this.progress = Math.ceil(((this.queuePosition + 1) / this.queueLength) * 100);
        }
    },

    renderWord : function(word)
    {
        var length = word.length,
            center = Math.floor(length/2),
            highlightIndex = center > 1 ? center -1 : center,
            paddingLength = highlightIndex > 10 ? 10 : 10 - highlightIndex;

        if (length == 0)
            return '&nbsp;';

        var padding = ' '.repeat(paddingLength);

        word = word.injectTo(highlightIndex, '<span class="red">' + word.charAt(highlightIndex) + '</span>');

        return padding + word;
    },

    intervalInMilliseconds : function(wpm)
    {
        return (1 / (wpm / 60)) * 1000 * this.speedFactor;
    },

    speedFactor : 1,
    splitText: function(text)
    {
        var queue = [],
            splitted = text.split(/[ \n\t]+/),
            originalLength = splitted.length;

        for (var i = 0 ; i < originalLength; i++)
        {
            var word = splitted.shift();

            if (word.length == 0)
                continue;

            if (word.length > 16)
            {
                var aboutMiddle = (word.length/2),
                    partA = word.substring(0, aboutMiddle) + '-',
                    partB = word.substring(aboutMiddle+1)
                queue.push(this.renderWord(partA))
                queue.push(this.renderWord(partB));
                continue;
            }
            queue.push(this.renderWord(word));

            //After dot add 2 ticks pause
            if (word[word.length - 1] == ',')
            {
                queue.push(' ');
            }
            //After comma add a pause
            else if (word[word.length - 1] == '.')
            {
                queue.push(' ')
                queue.push(' ');
            }
        }

        this.speedFactor = (originalLength / queue.length);
        return queue;
    },

    eventTriggered : function(name)
    {
        if (this.eventMapping[name])
        {
            for(var i = 0, max = this.eventMapping[name].length; i < max; i++)
            {
                this.eventMapping[name][i](this);
            }
        }
    }
};