//due to not having the ablity to actually set seeding up we will have to create our own random functionality
class Random
{
    constructor(seed)
    {
        this.s = seed == 0 ? 1 : seed; // 0 causes a weird bug
        this.t = 1;
    }
    hash(str, key=100) //this is a very lose hash shouldnt be used for anything serious. Mainly used for controled random colorization
    {
        let t = key;
        str = 36969 * (str & 65535) + (str >> 16);
        t = 18000 * (t & 65535) + (t >> 16);
        return Math.abs((((str << 16) + t) % 100000)*0.00001).toFixed(4);
    }
    random()//Random hash that i found a long time ago something similar to mulberry 32
    {
        this.s = 36969 * (this.s & 65535) + (this.s >> 16);
        let t = 18000 * (this.t & 65535) + (this.t >> 16);
        this.t++; // do this so t goes 1 then 2 then 3 etc then t becomes the number of times called
        return Math.abs((((this.s << 16) + t) % 100000)*0.00001).toFixed(4);
    }
    randomRange(l,h) {return this.random() * (h-l)+l}
    setSeed(seed){s = seed; t = 1; } //when seed is reset reset t; should be called over directly setting s;
}


//if a static number is passed in here then it can work just like a standard Seeded random (for debugging)
const random = new Random(Math.random()*99999999* (Math.random()>=0.5 ? 1 : -1)) //for pure randomness that is not seed controled, to replace Math.random
//const random = new Random(100); //use in place for controled random
