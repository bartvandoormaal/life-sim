class World {

    constructor() {
        //List of all agents (life) in this world
        this.agents = [];
        //List of all food items
        this.food = [];

        //PQT to keep track of the food
        this.foodQT = undefined;
        //PQT to keep track of life
        this.lifeQT = undefined;

        //Populate the world with food
        for( let i = 0 ; i < 300 ; i++ ) {
            this.food.push( new Food( Math.floor(random( 0,width )), Math.floor(random( 0,height ) ) ) );
        }

        //Populate the world with life
        for( let i = 0 ; i < 75 ; i++ ) {
            this.agents.push( new Life( random( 0,width ), random( 0,height ), p5.Vector.random2D(), 1 ) );
        }
        

        
        //Rebuild the food PQT
        this.rebuildFoodQT();

        //Rebuild the life PQT
        this.rebuildLifeQT();

        this.tickCount = 0;
    }

    //Render 
    render() {
        //Food
        for( let i = 0 ; i < this.food.length ; i++ ) {
            this.food[i].render();
        }
        //Agents
        for( let i = 0 ; i < this.agents.length ; i++ ) {
            this.agents[i].render();
        }        
    }

    //Tick / update the world
    tick() {

        //Agents
        for( let i = 0 ; i < this.agents.length ; i++ ) {
            this.agents[i].tick( this );
            this.agents[i].edges();
        }

        if( this.tickCount % 5 == 0 ) {
            for( let i = 0 ; i < this.food.length ; i++ ) {
                this.food[i].tick( this );
            }
        }

        //Remove eaten food
        this.removeEatenFood();
        this.rebuildFoodQT();


        //Remove dead agents from world
        this.removeDeadAgents();
        this.rebuildLifeQT();

        this.tickCount++;
    }

    //Rebuilds the food PQT
    rebuildFoodQT() {
        let boundary = new Rectangle( 0, 0, width, height );
        this.foodQT  = new PointQuadTree( boundary, 4, '' );
        for( let F = 0 ; F < this.food.length ; F++ ){
            this.foodQT.insert( new Point( this.food[ F ].pos.x, this.food[ F ].pos.y, this.food[ F ] ) );
        }
    }

    //Rebuilds the Live PQT
    rebuildLifeQT() {
        let boundary = new Rectangle( 0, 0, width, height );
        this.lifeQT = new PointQuadTree( boundary, 4, '' );
        for( let L = 0 ; L < this.agents.length ; L++ ){
          this.lifeQT.insert( new Point( this.agents[ L ].pos.x, this.agents[ L ].pos.y, this.agents[ L ] ) );
        }
      }

    //Removes dead agents
    removeDeadAgents() {
        for( let A = 0 ; A < this.agents.length ; A++ ) {
            if( this.agents[ A ].dead ) { 
                this.agents.splice( A, 1 ); 
                this.removeDeadAgents();
                break;
            }
        }      
    }

    //Removes eaten food
    removeEatenFood() {
        for( let F = 0 ; F < this.food.length ; F++ ) {
            if( this.food[ F ].eaten ) { 
                this.food.splice( F, 1 ); 
                this.removeEatenFood();
                break;
            }
        }  
      }

}