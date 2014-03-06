String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

/**
 * Created by joona on 06/03/14.
 */
speedReader =
{
    wordQueue : [],
    wordsPerMinute : 220,
    intervalId : null,
    reading : false,
    bindedElement : null,

    read : function (text)
    {
        this.wordQueue = this.splitText(text);
        return this;
    },

    readFrom : function (elementId)
    {
        return this.read($('#' + elementId)[0].value.trim());
    },

    bind : function(elementId)
    {
        this.bindedElement = $('#' + elementId);
        return this;
    },

    start : function()
    {
        this.intervalId = setInterval(
            function(){ speedReader.nextWord(); },
            this.intervalInMilliseconds(this.wordsPerMinute)
        );
        this.reading = true;
        return this;
    },

    setSpeed : function(wpm)
    {
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
        return this;
    },

    stop : function()
    {
        this.pause();
        this.wordQueue = [];
        return this;
    },

    nextWord : function ()
    {
        if (this.wordQueue.length == 0)
        {
            this.stop();
        }
        else
        {
            var nextWord = this.wordQueue.shift();
            this.bindedElement.html(this.renderWord(nextWord));
        }
        return this;
    },

    renderWord : function(word)
    {
        var threshold = 3,
            length = word.length,
            output = [];

        if (length == 0)
            return '&nbsp;';

        if (length <= threshold)
        {
            output = '_'.repeat(threshold-length);
        }
        output += word;

        var outputArray = output.split('');

        outputArray.splice(threshold-1, 0, '<span class="red">');
        outputArray.splice(threshold+1, 0, '</span>');

        return outputArray.join('');
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

            if (word.length > 18)
            {
                var aboutMiddle = (word.length/2).round(1),
                    partA = word.substring(0, aboutMiddle) + '-',
                    partB = word.substring(aboutMiddle+1)
                queue.push(partA)
                queue.push(partB);
                continue;
            }
            queue.push(word);

            if (word[word.length - 1] == '.')
            {
                queue.push('')
                queue.push('');
            }else if (word[word.length - 1] == ',')
            {
                queue.push('');
            }
        }

        return queue;
    }
};