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

    /**
     * Add a callback function to given event(s)
     * The callback function will be called with speedReader as first parameter
     *
     * speedReader.on('stop', function(reader){ alert('the reader has stopped'); });
     *
     * @param string event name of event or events separated with space
     * @param function callBack function to call on event
     * @returns {speedReader}
     */
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

    /**
     * Clears the queue
     * Usefull when re-reading
     * @returns {speedReader}
     */
    clearQueue : function()
    {
        this.eventTriggered('clear');
        this.wordQueue = [];
        this.queueLength = 0;
        return this;
    },

    /**
     * Parses and appends given text to queue
     *
     * @param text
     * @returns {speedReader}
     */
    readToQueue : function (text)
    {
        this.eventTriggered('read');
        this.wordQueue = this.wordQueue.concat(this.splitText(text));
        this.queueLength = this.wordQueue.length;
        return this;
    },

    /**
     * Reads the _value_ of given field into queue
     * Field is indicated by selector (.elementClass or #elementID)
     *
     * New content will pe appended to the end of the queue - to replace use .clearQueue().readField('#field-to-read')
     *
     * @param string elementSelector
     * @returns {speedReader}
     */
    readField : function (elementSelector)
    {
        var htstring = $(elementSelector).val(),
            stripped = htstring.replace(/(<([^>]+)>)/ig,"");
        return this.readToQueue(stripped);
    },

    /**
     * Reads the _content_ of given element into queue
     * Field is indicated by selector (.elementClass or #elementID)
     *
     * New content will pe appended to the end of the queue - to replace use .clearQueue().readElement('#field-to-read')
     *
     * @param string elementSelector
     * @returns {speedReader}
     */
    readElement : function(elementSelector)
    {
        var htstring = $(elementSelector).html(),
            stripped = htstring.replace(/(<([^>]+)>)/ig,"");
        return this.readToQueue(stripped);
    },


    /**
     * Sets the element to display the words in
     *
     * Elements innerHtlm will be updated with each type() -call
     *
     * @param string elementSelector jQuery selector
     * @returns {speedReader}
     */
    bind : function(elementSelector)
    {
        this.bindedElement = $(elementSelector);
        return this;
    },

    /**
     * Sets the reading-speed as words-per-minute
     * If reading will pause and continue with new speed
     *
     * @param int wpm
     * @returns {speedReader}
     */
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

    /**
     * Start reading
     * @returns {speedReader}
     */
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

    /**
     * Toggle reading - if reading will pause, if not reading will start reading
     * @returns {speedReader}
     */
    togglePlay : function()
    {
        return this.reading ? this.pause() : this.start();
    },

    /**
     * Temporary stops reading - the queue position will be preserved
     * @returns {speedReader}
     */
    pause : function()
    {
        clearInterval(this.intervalId);
        this.reading = false;
        this.eventTriggered('pause');
        return this;
    },

    /**
     * Stop reading - the queue position will be reset to 0
     * @returns {speedReader}
     */
    stop : function()
    {
        clearInterval(this.intervalId);
        this.reading = false;
        this.queuePosition = 0;
        this.eventTriggered('stop');
        return this;
    },

    /**
     * Types the next word from queue into element indicated via .bind()
     * @returns {speedReader}
     */
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

    /**
     * Updates the progress indicator according to current position in queue
     */
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

    /**
     * Adds padding and highlight to given word
     * @param string word
     * @returns string
     */
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

    /**
     * Calculate the interval length according to words-per-minute and speed-factor
     * @param wpm
     * @returns {number}
     */
    intervalInMilliseconds : function(wpm)
    {
        return (1 / (wpm / 60)) * 1000 * this.speedFactor;
    },

    /**
     *  Factor used to fix reading-speed
     *  @var float speedFactor
     */
    speedFactor : 1,

    /**
     * Parses given text by splitting it by white-spaces
     *
     * Renders each words with renderWord()
     * Splits > 16 character words into two words
     * Adds 2 frames 'pause' after dot (.) and 1 frame 'pause' after comma (,) to improve reading experience
     *
     * @param text
     * @returns {Array}
     */
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

    /**
     * Calls call-back-function(s) of given event if any
     *
     * Call-back functions are set with .on() method
     * Call-back functions will be called with speedReader as first parameter
     *
     * @param string name
     */
    eventTriggered : function(eventName)
    {
        if (this.eventMapping[eventName])
        {
            for(var i = 0, max = this.eventMapping[eventName].length; i < max; i++)
            {
                this.eventMapping[eventName][i](this);
            }
        }
    }
};