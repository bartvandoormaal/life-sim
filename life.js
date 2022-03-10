const REPRODUCTION_CYCLE_NONE = 0;
const REPRODUCTION_CYCLE_MOVING_TOWARDS_MATE = 1;
const REPRODUCTION_CYCLE_MOVING_MATING = 2;


const MATING_DISTANCE = 3;  // How far apart (or close to each other) do entities need to be in order to mate
const EATING_DISTANCE = 3;  // Same thing, except for eating food


class Life extends Entity {
    constructor(x, y, vel = createVector(1, 0), gen ) {
        super(x, y, vel);

        //Keeps track of the generation, just for fun
        this.generation = gen;

        //Maximum/minimum allowed/possible values
        this.maxSpeed = 1.25;
        this.maxAge = random( 350, 1500 ); //In Ticks
        this.minReproductionAge = ( this.maxAge/100 * random(5,20) ); //In Ticks
        this.maxReproductionAge = this.maxAge - ( this.maxAge/100 * random(5,20) ); //In Ticks
        this.foodScanMaxDistance = 75; //In Units
        this.energyMax = random( 1500, 2750 );
        this.reproductionMaxScanDist = 100;
        this.foodSearchMaxScanDist = 120;

        //Food in range must be above or equal (food for offspring)
        this.reproductionFoodThreshold = random( 1, 4 );
        //Life in range must be less or equal  (must not be to crowded for offspring)
        this.reproductionLifeThreshold = random( 4, 12 );

        //Inital values
        this.age = 0;  
        this.dead = false;
        this.energy = random( (this.energyMax/5), this.energyMax );
        this.hungerLevel = this.energy/100*75 ; //random( (this.energyMax/100*15), this.energy/100*75 );
        this.reproductionCoolDown = 0; 

        //The closest food source
        this.closestFood = undefined;

        //Does this entity prefer to live in a herd?
        this.flocks = true;

        //The closest possible mate for reproduction
        this.closestMate = undefined;

        //List of all food en other entities around this entity
        this.foodInRange = [];
        this.lifeInRange = [];

        
    }

    //Tick / Update
    tick( world ) {
        super.tick();

        world.rebuildLifeQT();


        // Use energy
        this.energy -= this.size / 10;
        
        // Age
        this.age += 0.2;

        // Die
        if( this.energy <= 0 || this.age >= this.maxAge ) {
            this.dead = true;
            return;
        }

        // Reproduction
        if( this.reproductionCoolDown > 0 ) {
            this.reproductionCoolDown--;
        }

        // Find thing around the entity
        this.findFood( world );
        this.findMate( world );

        // Find the next location to travel to
        this.setNextDestionation();

        // Set movement in acceleration force 
        this.applyForce( this.destination );
        

        // Apply movement
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);        

    }


    //Finds the next destination 
    setNextDestionation() {


        //Flocking Entity?
        if ( this.flocks ) {
            this.destination = this.flock();
        }

        //Non-Flocking
        else {

            // Reproduction has priority when possible (survival of the species is more important than own survival)
            if( typeof this.closestMate != "undefined" && this.reproductionCoolDown == 0 ) {
                //When close enough, reproduce
                if( dist( this.pos.x, this.pos.y, this.closestMate.pos.x, this.closestMate.pos.y ) <= MATING_DISTANCE ) {
                    this.mate( world, this.closestMate );
                }
                //If not, move towards mate
                else {
                    this.destination = this.pursue( this.closestMate ).setMag(this.maxForce);
                }
            }
            
            // If not reproducing, energy/hunger is the most important
            else if( typeof this.closestFood != "undefined" && this.energy <= this.hungerLevel ) {
                let distanceToFood = dist( this.pos.x, this.pos.y, this.closestFood.pos.x, this.closestFood.pos.y );

                //When at eating distance, eat food
                if( distanceToFood <= EATING_DISTANCE ) {
                    this.eat( this.closestFood );
                    this.destination = createVector( 0,0 ); //stop
                    this.closestFood = undefined;
                }
                //When close to eating distance, arrive  (this is just a visual thing, it look pretty)
                else if( distanceToFood <= EATING_DISTANCE * 5 ) {
                    this.destination = this.arrive( this.closestFood.pos ).setMag( this.maxForce )
                }
                //Just move towards food source
                else {                
                    this.destination = this.pursue( this.closestFood ).setMag( this.maxForce );
                }
            }
            // Just wander
            else {
                this.destination = this.wander();
            }
        }
    }




    
    //Find the nearest source of for food
    findFood( world ) {
        //Use PQT to find nearby food sources
        let range = new Rectangle( this.pos.x - this.foodSearchMaxScanDist / 2, this.pos.y - this.foodSearchMaxScanDist / 2, this.foodSearchMaxScanDist, this.foodSearchMaxScanDist ); 
        this.foodInRange = world.foodQT.query( range );
        let closest = Infinity;
        //Get closest
        for( let F = 0 ; F < this.foodInRange.length ; F++ ) {
            let d = dist( this.pos.x, this.pos.y, this.foodInRange[ F ].x, this.foodInRange[ F ].y );
            if( d < closest ) {
                closest = d;
                this.closestFood = this.foodInRange[ F ].refTo;
            }
        }
    } 

     //Find the nearest compatible mate
    findMate( world ) {
        //Use PQT to find nearby food sources
        let range = new Rectangle( this.pos.x - this.reproductionMaxScanDist / 2, this.pos.y - this.reproductionMaxScanDist / 2, this.reproductionMaxScanDist, this.reproductionMaxScanDist ); 
        this.lifeInRange = world.lifeQT.query( range );
        let closest = Infinity;
        
        for( let L = 0 ; L < this.lifeInRange.length ; L++ ) {
            let d = dist( this.pos.x, this.pos.y, this.lifeInRange[ L ].x, this.lifeInRange[ L ].y );
            if( d < closest && this.lifeInRange[ L ].refTo != this && this.lifeInRange[ L ].refTo.canReproduce() ) {
                this.closest = d;
                this.closestMate = this.lifeInRange[ L ].refTo
            }
        }

        //An existing closetMate might have moved to far away
        if( typeof this.closestMate != "undefined") {
            let d = dist( this.pos.x, this.pos.y, this.closestMate.pos.x, this.closestMate.pos.y );
            if( d > this.reproductionMaxScanDist ) {
                this.closestMate = undefined;
            }
        }

        //Set this as mate for target
        if( typeof this.closestMate != "undefined") {
            this.closestMate.closestMate = this;
        }
    }

    //Eat food
    eat( food ) {
        //Get energy from food
        this.energy += food.nutritionalValue;

        //Cap to max engery
        if ( this.energy > this.maxEnergy ) {
          this.energy = this.maxEnergy;
        }

        //Food has been eaten
        food.eaten = true;         
    }

   

    //Can this entity reproduce?
    canReproduce() {
        let r = ( !this.dead &&
                 this.reproductionCoolDown == 0 &&
                 this.energy > this.hungerLevel &&
                 this.age > this.minReproductionAge &&
                 this.age < this.maxReproductionAge &&
                 this.foodInRange.length >= this.reproductionFoodThreshold &&
                 this.lifeInRange.length <= this.reproductionLifeThreshold
               ) ;
            return r;
    }

    
    //Mate / reproduce
    mate( world, mateWith ) {

        if( typeof mateWith.closestMate == "undefined" ) {
            return;
        }
        

        let offspring = new Life( 0, 0 );  
        offspring.generation = this.generation + 1;
        
        offspring.pos.x = this.pos.x;
        offspring.pos.y = this.pos.y;
        
        offspring.size = ( random(0,1) < 0.5 ) ? 
                          ( ( this.size * random(0.70,0.80) ) + ( mateWith.size * random(0.20,0.30) ) )  : 
                          ( ( this.size * random(0.20,0.30) ) + ( mateWith.size * random(0.70,0.80) ) )  ;
        
        
        offspring.foodScanMaxDistance = ( random(0,1) < 0.5 ) ?
                                         ( ( this.foodScanMaxDistance * random(0.70,0.80) ) + ( mateWith.foodScanMaxDistance * random(0.20,0.30) ) ) / 2 : 
                                         ( ( this.foodScanMaxDistance * random(0.20,0.30) ) + ( mateWith.foodScanMaxDistance * random(0.70,0.80) ) ) / 2 ;
        
        offspring.maxAge = ( random(0,1) < 0.5 ) ?
                            ( ( this.maxAge * random(0.70,0.80) ) + ( mateWith.maxAge * random(0.20,0.30) ) ) / 2 : 
                            ( ( this.maxAge * random(0.20,0.30) ) + ( mateWith.maxAge * random(0.70,0.80) ) ) / 2 ;
        
        offspring.energyMax = ( random(0,1) < 0.5 ) ?
                               ( ( this.energyMax * random(0.70,0.80) ) + ( mateWith.energyMax * random(0.20,0.30) ) ) / 2 : 
                               ( ( this.energyMax * random(0.20,0.30) ) + ( mateWith.energyMax * random(0.70,0.80) ) ) / 2 ;
        
        
        offspring.energy = random( offspring.energyMax-(offspring.energyMax/4), offspring.energyMax );
        
        offspring.age = 0;
            
        offspring.reproductionFoodThreshold = ( random(0,1) < 0.5 ) ?
                                               ( ( this.reproductionFoodThreshold * random(0.70,0.80) ) + ( mateWith.reproductionFoodThreshold * random(0.20,0.30) ) ) / 2 : 
                                               ( ( this.reproductionFoodThreshold * random(0.20,0.30) ) + ( mateWith.reproductionFoodThreshold * random(0.70,0.80) ) ) / 2 ;
        
        offspring.reproductionLifeThreshold = ( random(0,1) < 0.5 ) ?
                                               ( ( this.reproductionLifeThreshold * random(0.70,0.80) ) + ( mateWith.reproductionLifeThreshold * random(0.20,0.30) ) ) / 2 : 
                                               ( ( this.reproductionLifeThreshold * random(0.20,0.30) ) + ( mateWith.reproductionLifeThreshold * random(0.70,0.80) ) ) / 2 ;

        offspring.hungerLevel = ( random(0,1) < 0.5 ) ?
                                               ( ( this.hungerLevel * random(0.70,0.80) ) + ( mateWith.hungerLevel * random(0.20,0.30) ) ) / 2 : 
                                               ( ( this.hungerLevel * random(0.20,0.30) ) + ( mateWith.hungerLevel * random(0.70,0.80) ) ) / 2 ;
        

        offspring.minReproductionAge = ( random(0,1) < 0.5 ) ?
                                               ( ( this.minReproductionAge * random(0.70,0.80) ) + ( mateWith.minReproductionAge * random(0.20,0.30) ) ) / 2 : 
                                               ( ( this.minReproductionAge * random(0.20,0.30) ) + ( mateWith.minReproductionAge * random(0.70,0.80) ) ) / 2 ;                                               
        offspring.maxReproductionAge = ( random(0,1) < 0.5 ) ?
                                               ( ( this.maxReproductionAge * random(0.70,0.80) ) + ( mateWith.maxReproductionAge * random(0.20,0.30) ) ) / 2 : 
                                               ( ( this.maxReproductionAge * random(0.20,0.30) ) + ( mateWith.maxReproductionAge * random(0.70,0.80) ) ) / 2 ;                                               


        this.reproductionCoolDown = 500;
        mateWith.reproductionCoolDown = 500;
        offspring.reproductionCoolDown = 500;
        

        this.closestMate = undefined;
        mateWith.closestMate = undefined
        offspring.closestMate = undefined;


        this.targetedAsMateBy = undefined;
        mateWith.targetedAsMateBy = undefined;
        offspring.targetedAsMateBy = undefined;


        world.agents.push( offspring );

        //console.log(`NEW LIFE BORN (${world.agents.length})`);
      
    }
    

    //overload for entity version, this one also steers towards food
    cohesion(  ) {

        //MATE
        if( typeof this.closestMate != "undefined" && this.reproductionCoolDown == 0 ) {
            //When close enough, reproduce
            if( dist( this.pos.x, this.pos.y, this.closestMate.pos.x, this.closestMate.pos.y ) <= MATING_DISTANCE ) {
                this.mate( world, this.closestMate );
            }
            //If not, move towards mate
            else {
                return this.pursue( this.closestMate ).setMag(this.maxForce).mult(25);
                //return createVector( this.closestMate.pos.x, this.closestMate.pos.y );
            }
        }

        //FOOD
        if( typeof this.closestFood != "undefined" && this.energy <= this.hungerLevel ) {
            let distanceToFood = dist( this.pos.x, this.pos.y, this.closestFood.pos.x, this.closestFood.pos.y );
            if( distanceToFood <= EATING_DISTANCE ) {
                this.eat( this.closestFood );
                this.closestFood = undefined;
                return createVector( 0,0 );
            }
            else if( distanceToFood <= EATING_DISTANCE * 5 ) {
                return this.arrive( this.closestFood.pos ).setMag( this.maxForce ).mult(25);
            }
            else {                
                return this.pursue( this.closestFood ).setMag( this.maxForce ).mult(25);
            }
        }
        
        //GROUP
        return super.cohesion();
    }  



    render() {
        //Render as triangle
        noStroke();


        if( window.checkRenderColoredEntities.checked() ) {
            //Hungry
            if( this.energy <= this.hungerLevel ) {
                fill(22, 214, 15);
            }
            //Can reproduce 
            else if( this.canReproduce() ) {
                fill(184, 0, 0);
            }
            //Moving towards mate
            else if( typeof this.closestMate != "undefined" ) {
                fill(251, 0, 255);
            }
            //Normal
            else {
                fill(20,20,20);
            }
        }
        else {
            fill(0,0,0);
        }
        

        push();
            translate(this.pos.x, this.pos.y);
            rotate(this.vel.heading());
            triangle(-this.size, -this.size / 2, -this.size, this.size / 2, this.size, 0);
        pop();  
      

        if( window.checkRenderLines.checked() ) {
            //Line to food source
            if( typeof this.closestFood != "undefined" && this.energy <= this.hungerLevel ) {
                strokeWeight(1);
                drawingContext.setLineDash([5, 3]);
                stroke( color('rgba(22, 214, 15, 0.8)') );
                line( this.pos.x, this.pos.y, this.closestFood.pos.x, this.closestFood.pos.y ); 
                drawingContext.setLineDash([ ]);
            }

            //Line to mate
            if( typeof this.closestMate != "undefined" && this.reproductionCoolDown == 0 ) {
                strokeWeight(1);
                drawingContext.setLineDash([5, 3]);
                stroke( color('rgba(252, 3, 144, 0.9)') );
                line( this.pos.x, this.pos.y, this.closestMate.pos.x, this.closestMate.pos.y ); 
                drawingContext.setLineDash([ ]);
            }
        }


        if( window.checkRenderDtls.checked() ) {
        
            // Generation
            textSize(9);
            noStroke();
            fill(0,0,0);
            text( this.generation, this.pos.x + 5, this.pos.y+5 );

            // Age bar
            strokeWeight(0);
            stroke( 0,0,0 );
            fill( 0,30,50 );
            rect( this.pos.x - 10, this.pos.y + 10, 20, 3 );
            fill( 0,133,249 );
            rect( this.pos.x - 10, this.pos.y + 10, map( this.age, 0, this.maxAge, 20, 0) , 3 );
            
            strokeWeight(1);
            stroke( 0,0,0 );
            line( this.pos.x - 10 + map( this.minReproductionAge, 0, this.maxAge, 0, 20), this.pos.y + 9, this.pos.x - 10 + map( this.minReproductionAge, 0, this.maxAge, 0, 20), this.pos.y + 14 )
            line( this.pos.x - 10 + map( this.maxReproductionAge, 0, this.maxAge, 0, 20), this.pos.y + 9, this.pos.x - 10 + map( this.maxReproductionAge, 0, this.maxAge, 0, 20), this.pos.y + 14 )
            
            

            // Energy bar
            strokeWeight(0);
            stroke( 0,0,0 );
            fill( 100,0,0 );
            rect( this.pos.x - 10, this.pos.y + 16, 20, 3 );
            fill( 0,255,0 );
            rect( this.pos.x - 10, this.pos.y + 16, map( this.energy, 0, this.energyMax, 0, 20) , 3 );

            strokeWeight(1);
            stroke( 0,0,0 );
            line( this.pos.x - 10 + map( this.hungerLevel, 0, this.energyMax, 0, 20), this.pos.y + 15, this.pos.x - 10 + map( this.hungerLevel, 0, this.energyMax, 0, 20), this.pos.y + 20 )
        }


    }
    
   

}