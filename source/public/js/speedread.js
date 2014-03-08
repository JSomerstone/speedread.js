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
        this.eventMapping[event] = {
            callBack : callBack
        };
        return this;
    },

    read : function (text)
    {
        this.eventTriggered('read');
        this.wordQueue = this.splitText(text);
        this.queueLength = this.wordQueue.length;
        this.queuePosition = 0;
        return this;
    },

    readFrom : function (elementId)
    {
        return this.read($('#' + elementId)[0].value.trim());
    },

    bind : function(elementId)
    {
        this.bindedElement = document.getElementById(elementId);
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
        this.progress = Math.ceil(((this.queuePosition + 1) / this.queueLength) * 100);

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
        return (1 / (wpm / 60)) * 1000;
    },

    splitText: function(text)
    {
        var queue = [],
            splitted = text.split(' ');

        for (var i = 0, n = splitted.length; i < n; i++)
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

        return queue;
    },

    eventTriggered : function(name)
    {
        if (this.eventMapping[name])
            this.eventMapping[name].callBack(this);

    }
};