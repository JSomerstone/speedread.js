/**
 * Created by joona on 06/03/14.
 */
speedReader =
{
    wordQueue : [],
    wordsPerMinute : 100,
    intervalId : null,

    read : function (text)
    {
        this.wordQueue = text.split(' ');
        console.log(this.wordQueue.length + ' words')
    },

    start : function()
    {
        this.intervalId = setInterval(function(){ this.showWord(); }, (this.wordsPerMinute / 60) * 1000);
        console.log((this.wordsPerMinute / 60) * 1000, this.intervalId);
    },

    stop : function()
    {
        clearInterval(this.intervalId);
    },

    showWord : function ()
    {
        if (this.wordQueue.length == 0)
        {
            this.stop();
        }
        else
        {
            var nextWord = this.wordQueue.shift();
            console.log(nextWord);

        }
    }
};