# Virus spread simulation

Exploring how to create a particle system to create a visual simulation of how viruses can spread between people using matter.js


## Why matter.js

Thinking that a physics engine would have all the functionality I'd be looking for (it did) I reached for Matter.js. Unfortuantely, there's a little too much physics where the collisions meant the simulation gradually lost all movement.

Trying to finesse this with velocity and force updates only contributed to the entropy.

I'm sure there's a way to configure it to do as I want but there are so many additional features that I don't need I'm pausing development on this solution to explore writing a bespoke, simpler system suited to me needs.
