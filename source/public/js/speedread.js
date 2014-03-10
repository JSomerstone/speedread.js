
function SpeedReader ()
{
    var wordQueue = [],
        queueLength = 0,
        queuePosition = 0,
        progress = 0,

        speed,
        intervalId = null,
        reading = false,
        output = null,

        eventMapping = {},

        /**
         *  Factor used to fix reading-speed
         *  @var float speedFactor
         */
        speedFactor = 1;

    var self = this;

    /**
     * Add a callback function to given event(s)
     * The callback function will be called with SpeedReader as first parameter
     *
     * SpeedReader.on('stop', function(reader){ alert('the reader has stopped'); });
     *
     * @param string event name of event or events separated with space
     * @param function callBack function to call on event
     * @returns {SpeedReader}
     */
    this.on = function(event, callBack)
    {
        var events = event.split(' ');

        for(var i = 0, max = events.length; i < max; i++)
        {
            if ( ! eventMapping[events[i]])
            {
                eventMapping[events[i]] = new Array();
            }
            eventMapping[events[i]].push(callBack);
        }
        return this;
    }

    /**
     * @private
     * Calls call-back-function(s) of given event if any
     *
     * Call-back functions are set with .on() method
     * Call-back functions will be called with SpeedReader as first parameter
     *
     * @param string name
     */
    function eventTriggered (eventName)
    {
        if (eventMapping.hasOwnProperty(eventName))
        {
            for(var i = 0, max = eventMapping[eventName].length; i < max; i++)
            {
                eventMapping[eventName][i](self, eventName);
            }
        }
    }

    /**
     * Clears the queue
     * Useful when re-reading
     * @returns {SpeedReader}
     */
    this.clearQueue = function()
    {
        wordQueue = [];
        queueLength = 0;
        queuePosition = 0;
        progress = 0;
        output.html('&nbsp;');
        eventTriggered('clear');
        return this;
    }

    /**
     * Parses and appends given text to queue
     *
     * @param text
     * @returns {SpeedReader}
     */
    this.readToQueue = function (text)
    {
        wordQueue = wordQueue.concat(splitText(text));
        queueLength = wordQueue.length;
        eventTriggered('read');
        return this;
    }

    /**
     * Reads the _value_ of given field {number}o queue
     * Field is indicated by selector (.elementClass or #elementID)
     *
     * New content will pe appended to the end of the queue - to replace use .clearQueue().readField('#field-to-read')
     *
     * @param string elementSelector
     * @returns {SpeedReader}
     */
    this.readField = function (elementSelector)
    {
        var htstring = jQuery(elementSelector).val(),
            stripped = htstring.replace(/(<([^>]+)>)/ig,"");
        return this.readToQueue(stripped);
    }

    /**
     * Reads the _content_ of given element {number}o queue
     * Field is indicated by selector (.elementClass or #elementID)
     *
     * New content will pe appended to the end of the queue - to replace use .clearQueue().readElement('#field-to-read')
     *
     * @param string elementSelector
     * @returns {SpeedReader}
     */
    this.readElement = function(elementSelector)
    {
        var htstring = jQuery(elementSelector).html(),
            stripped = htstring.replace(/(<([^>]+)>)/ig,"");
        return this.readToQueue(stripped);
    }


    /**
     * Sets the element to display the words in
     *
     * Elements innerHtlm will be updated with each type() -call
     *
     * @param string elementSelector jQuery selector
     * @returns {SpeedReader}
     */
    this.bind = function(elementSelector)
    {
        output = jQuery(elementSelector);
        return this;
    }

    /**
     * Sets the reading-speed as words-per-minute
     * If reading will continue with new speed
     * If new speed is 0 will pause
     *
     * @param {number} wpm
     * @returns {SpeedReader}
     */
    this.setSpeed = function(wpm)
    {
        eventTriggered('speed-change')
        if (wpm <= 0)
        {
            speed = 0;
        } else {
            speed = wpm;
        }

        if (speed === 0)
        {
            this.pause();
        }
        else if (reading)
        {
            this.pause().start();
        }
        return this;
    }

    /**
     * Change the reading-speed by wpmChange
     * @param {number} wpmChange
     * @returns {SpeedReader}
     */
    this.changeSpeed = function(wpmChange)
    {
        var newSpeed = speed + wpmChange <= 0
            ? 0
            : speed + wpmChange;

        return this.setSpeed(newSpeed)
    }

    /**
     * Getter for current speed
     * @returns {number}
     */
    this.getSpeed = function()
    {
        return speed;
    }

    /**
     * Getter for progress 0..100
     * @returns {number}
     */
    this.getProgress = function()
    {
        return progress;
    }
    
    /**
     * Start reading
     * @returns {SpeedReader}
     */
    this.start = function()
    {
        var selfObject = this;
        eventTriggered('start');
        intervalId = setInterval(
            function(){ selfObject.type(); },
            intervalInMilliseconds(speed)
        );
        reading = true;
        return this;
    }

    /**
     * Toggle reading - if reading will pause, if not reading will start reading
     * @returns {SpeedReader}
     */
    this.togglePlay = function()
    {
        return reading ? this.pause() : this.start();
    }

    /**
     * Temporary stops reading - the queue position will be preserved
     * @returns {SpeedReader}
     */
    this.pause = function()
    {
        clearInterval(intervalId);
        reading = false;
        eventTriggered('pause');
        return this;
    }

    /**
     * Stop reading - the queue position will be reset to 0
     * @returns {SpeedReader}
     */
    this.stop = function()
    {
        clearInterval(intervalId);
        reading = false;
        queuePosition = 0;
        eventTriggered('stop');
        return this;
    }

    /**
     * Types the next word from queue {number}o element indicated via .bind()
     * @returns {SpeedReader}
     */
    this.type = function ()
    {
        updateProgress();
        if (queueLength == queuePosition + 1)
        {
            this.stop();
        }
        else
        {
            output.html(wordQueue[queuePosition]);
        }
        queuePosition++
        eventTriggered('type');
        return this;
    }

    /**
     * Updates the progress indicator according to current position in queue
     */
    function updateProgress()
    {
        if (queueLength === 0)
        {
            progress = 0;
        }
        else
        {
            progress = Math.ceil(((queuePosition + 1) / queueLength) * 100);
        }
    }

    /**
     * Adds padding and highlight to given word
     * @param string word
     * @returns string
     */
    function renderWord(word)
    {
        var length = word.length,
            center = Math.floor(length/2),
            highlightIndex = center > 1 ? center -1 : center,
            paddingLength = highlightIndex > 10 ? 10 : 10 - highlightIndex;

        if (length == 0)
            return '&nbsp;';

        var padding = new Array(paddingLength).join(' ');

        word = word.substr(0, highlightIndex)
            + '<span class="red">'
            + word.charAt(highlightIndex)
            + '</span>'
            + word.substr(highlightIndex+1);

        return padding + word;
    }

    /**
     * @private
     * Calculate the interval length according to words-per-minute and speed-factor
     * @param {number} wpm
     * @returns {number}
     */
    function intervalInMilliseconds(wpm)
    {
        return (1 / (wpm / 60)) * 1000 * speedFactor;
    }

    /**
     * Parses given text by splitting it by white-spaces
     *
     * Renders each words with renderWord()
     * Splits > 16 character words {number}o two words
     * Adds 2 frames 'pause' after dot (.) and 1 frame 'pause' after comma (,) to improve reading experience
     *
     * @param text
     * @returns {Array}
     */
    function splitText(text)
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
                queue.push(renderWord(partA))
                queue.push(renderWord(partB));
                continue;
            }
            queue.push(renderWord(word));

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

        speedFactor = (originalLength / queue.length);
        return queue;
    }

    return this;
};