const MAX_SIZE = 6;

class Entity {
    constructor( x, y, vel = createVector(1, 0) ) {
        this.pos = createVector(x, y);  //Position
        this.vel = vel;  //Velocity
        this.acc = createVector(0, 0);  //Acceleration

        this.maxSpeed = 4;
        this.maxForce = 0.35;
        this.size = random( 2, MAX_SIZE );
        
        this.wanderTheta = PI/2;

        //Entity will move towards this
        this.destination = createVector(0,0);

        //Tick counter
        this.tickCnt = 0;

        //Boid settings
        this.maxFlockScanDistance = this.size * 5;
        this.separationVal = 15;
        this.alignmentVal  = 0.3;
        this.cohesionVal   = 5;
        
    }

    //Applies a force to the entity
    applyForce(force) {
        if( Array.isArray(force) ) {
            force.forEach( f => { this.acc.add( f ); } );
        }
        else {
            this.acc.add(force);
        }
    }
  
    //Tick / update
    tick() {
        this.tickCnt++;
    }
  

    //
    // MOVEMENT, see http://www.red3d.com/cwr/steer/gdc99/ for more information about these functions
    //

    //Random wandering
    wander() {
        let wanderTowards = this.vel.copy().setMag(100).add(this.pos);
        wanderTowards.add( 50 * cos( (this.wanderTheta + this.vel.heading()) ), 50 * sin( (this.wanderTheta + this.vel.heading()) ) );    
        this.wanderTheta += random(-0.3, 0.3);
        return wanderTowards.sub(this.pos).setMag(this.maxForce);
    }
  
    //Evade given target
    evade(entity) {
        return this.pursue(entity).mult(-1);
    }
  
    //Pursue given target
    pursue(entity) {
        return this.seek( entity.pos.copy().add( entity.vel.copy().mult(10) ) );
    }

    //Flee from given target
    flee(target) {
        return this.seek(target).mult(-1);
    }
  
    //Arrive at destination
    arrive(target) {
        return this.seek(target, true);
    }
  
    //Seek the path to given target
    seek(target, arrival = false) {
        let force = p5.Vector.sub(target, this.pos);
        let d = 20;
        return force.setMag( arrival && force.mag() < d ? map( force.mag(), 0, d, 0, this.maxSpeed ) : this.maxSpeed ).sub(this.vel).limit(this.maxForce);
    }



    //
    // BOIDS, more info @ https://www.red3d.com/cwr/boids/
    //

    // Flocking
    flock( ) {
        
        let range = new Rectangle( this.pos.x - this.reproductionMaxScanDist / 2, this.pos.y - this.reproductionMaxScanDist / 2, this.reproductionMaxScanDist, this.reproductionMaxScanDist ); 
        this.lifeInRange = world.lifeQT.query( range );

        let sep = this.separate(  ); // Separation
        let ali = this.align(  );    // Alignment
        let coh = this.cohesion(  ); // Cohesion
    
        // Arbitrarily weight these forces
        sep.mult( window.sSLider.value() );
        ali.mult( window.aSLider.value() );
        coh.mult( window.cSLider.value() );
    
        return [ sep, ali, coh ];
    }

    // Boid-Separation, Method checks for nearby boids and steers away
    separate(  ) {
        let desiredseparation = 5.0;
        let steer = createVector(0, 0);
        let count = 0;
        
        
        // For every boid surrounding this boud, check if it's too close
        for (let i = 0; i < this.lifeInRange.length; i++) {
            let d = p5.Vector.dist(this.pos, this.lifeInRange[i].refTo.pos);
            // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
            if ((d > 0) && (d < desiredseparation)) {
                // Calculate vector pointing away from neighbor
                let diff = p5.Vector.sub(this.pos, this.lifeInRange[i].refTo.pos);
                diff.normalize();
                diff.div(d); // Weight by distance
                steer.add(diff);
                count++; // Keep track of how many
            }
        }
        // Average -- divide by how many
        if (count > 0) {
            steer.div(count);
        }
    
        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.normalize();
            steer.mult(this.maxSpeed);
            steer.sub(this.vel);
            steer.limit(this.maxForce);
        }
        return steer;
    }
  
    // Boid-Alignment, For every nearby boid in the system, calculate the average velocity
    align(  ) {
        let neighbordist = 50;
        let sum = createVector(0, 0);
        let count = 0;
        for (let i = 0; i < this.lifeInRange.length; i++) {
            let d = p5.Vector.dist(this.pos, this.lifeInRange[i].refTo.pos);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(this.lifeInRange[i].refTo.vel);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(this.maxSpeed);
            let steer = p5.Vector.sub(sum, this.vel);
            steer.limit(this.maxForce);
            return steer;
        } else {
            return createVector(0, 0);
        }
    }
  
    // Boid-Cohesion, For the average location (the center) of all nearby boids, calculate steering vector towards that location
    cohesion(  ) {
        let neighbordist = this.maxFlockScanDistance;
        let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
        let count = 0;
        for (let i = 0; i < this.lifeInRange.length; i++) {
            let d = p5.Vector.dist(this.pos, this.lifeInRange[i].refTo.pos);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(this.lifeInRange[i].refTo.pos); // Add location
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            return this.seek(sum); // Steer towards the location
        } else {
            return createVector(0, 0);
        }
    }  
    
    


  

    //
    // RENDERING
    //

    //Render the entity
    render() {
        strokeWeight(0);
        fill(20,20,20);
        circle(this.pos.x, this.pos.y,5);
    }
  
    //Wrap around the area edges
    edges() {
        if (this.pos.x > width + this.size) {
            this.pos.x = -this.size;
        } 
        else if (this.pos.x < -this.size) {
            this.pos.x = width + this.size;
        }
        if (this.pos.y > height + this.size) {
            this.pos.y = -this.size;
        } 
        else if (this.pos.y < -this.size) {
            this.pos.y = height + this.size;
        }

    }
  }