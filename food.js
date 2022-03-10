class Food {
    constructor( x,y) {
        this.pos = createVector(x, y);  //Position
        this.vel = createVector(0, 0);  //0 velocity (this is needed by the varius movement controls)
        this.eaten = false;
        this.nutritionalValue = random( 20, 100 );
    }

    tick( world ) {
        //Look for other food sources nearby
        let range = new Rectangle( this.pos.x - 50, this.pos.y - 50, 100, 100 ); 
        let nearby = world.foodQT.query( range );

        //If low enough amount, change to spawn more food (note that other food sources might already have spawned nearby, as the PQT is update only once per world tick)
        if( nearby.length < 5 && random(0,1) < 0.6 ) {
            let x = random( -5, 5 );
            let y = random( -5, 5 );

            if( (x > 4 || x < -4) && 
                (y > 4 || y < -4) &&
                Math.floor( this.pos.x + x) > 0 && Math.floor( this.pos.x + x) < width && 
                Math.floor( this.pos.y + y ) > 0 && Math.floor( this.pos.y + y ) < height &&
                world.food.length < width  //seems to work out pretty well

            ) { 
                
                world.food.push( new Food( Math.floor( this.pos.x + x) , Math.floor( this.pos.y + y ) ) );
            }
            
        }
        
    }

    render() {
        strokeWeight(0);
        fill(0,100,0);
        circle(this.pos.x, this.pos.y,2);
    }
}