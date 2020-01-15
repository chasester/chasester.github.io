//due to not having the ablity to actually set seeding up we will have to create our own random functionality

const random = 
{
    s: 100, //s is a seed at which point to start
    t: 1 , //t is a hash always starting at zero that is changed over time
    hash: function(s) //is like random but the same s will always give the same number back
    {
        let t = 100;
        s = 36969 * (s & 65535) + (s >> 16);
        t = 18000 * (t & 65535) + (t >> 16);
        //console.log(t,s);
        return Math.abs((((s << 16) + t) % 100000)*0.00001).toFixed(4);
    },
    random: function() { //Random hash that i found a long time ago something similar to mulberry 32
        this.s = 36969 * (this.s & 65535) + (this.s >> 16);
        let t = 18000 * (this.t & 65535) + (this.t >> 16);
        this.t++; // do this so t goes 1 then 2 then 3 etc then t becomes the number of times called
        return Math.abs((((this.s << 16) + t) % 100000)*0.00001).toFixed(4);
    },
    randomRange: function(h,l) {return this.random() % (h-l)+l},
    setSeed: (seed) => {s = seed; t = 1; } //when seed is reset reset t;
}
