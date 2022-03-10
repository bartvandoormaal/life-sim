// A point, defined by 2 coords in 2d space
class Point {
    constructor( x, y, refTo ) {
        this.x = x;
        this.y = y;
        this.refTo = refTo;  //reference to the object at x,y
    }  
}

// A rectangle, defined by 2 coords, a with and a height, in 2d space
class Rectangle {
    constructor( x, y, w ,h ) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }  

    // Checks if the given point is inside (or on the edges) of the rectangle
    // Returns Boolean
    contains( point ) {
        return ( point.x >= this.x &&
                 point.x <= this.x + this.w &&
                 point.y >= this.y &&
                 point.y <= this.y + this.h     
        );
    }

  // Checks if the given rectable overlaps with this one
  // Returns Boolean
  intersects( rectangle ) {
    return (
        //TopLeft corner intersects this triangle
        ( rectangle.x >= this.x && rectangle.x <= this.x + this.w && rectangle.y >= this.y && rectangle.y <= this.y + this.h ) ||
        
        //BottomLeft corner intersects this triangle
        ( rectangle.x >= this.x && rectangle.x <= this.x + this.w && rectangle.y + rectangle.h >= this.y && rectangle.y + rectangle.h <= this.y + this.h ) ||
        
        //TopRight....
        ( rectangle.x + rectangle.w >= this.x && rectangle.x + rectangle.w <= this.x + this.w && rectangle.y >= this.y && rectangle.y <= this.y + this.h ) ||
        
        //Bottom right....
        ( rectangle.x + rectangle.w >= this.x && rectangle.x + rectangle.w <= this.x + this.w && rectangle.y + rectangle.h >= this.y && rectangle.y + rectangle.h <= this.y + this.h ) ||
        
        // rectangle overlaps this
        ( rectangle.x < this.x && rectangle.x + rectangle.w > this.x + this.w ) ||
        ( rectangle.y < this.y && rectangle.y + rectangle.h > this.y + this.h ) 
      );
    }

}
  
class PointQuadTree {

    // boundary : All points must be within this boundary
    // capacity : The amount of points in a quadrant before a dividing a quadrant
    constructor( boundary, capacity ) {
        this.quadantCapacity = capacity;
        this.boundary = boundary;

        this.divided = false;
        this.points = [];
    }

    // Inserts a point into the PQT
    // Return boolean
    insert( point ) {
        //If not inside the boundary, exit
        if( !this.boundary.contains( point ) ) {
            return false;
        }
    
        //If the capacity has not been reached, add the point and exit
        if( this.points.length < this.quadantCapacity ) {
            this.points.push( point );
            return true;
        }
        //If the capacity has been reached, divide
        else {
            //Divide if not already divided
            if( !this.divided ) {
                this.subdivide( point );
            }
            if( this.northWest.insert( point ) )      { return true; }
            else if( this.northEast.insert( point ) ) { return true; }
            else if( this.southWest.insert( point ) ) { return true; }
            else if( this.southEast.insert( point ) ) { return true; }   
        }

        //No point was added
        return false;
    }
  
    // Divide the tree/quadrant
    subdivide( point ) {
        this.divided = true;
    
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w;
        let h = this.boundary.h;
        
        let nwRect = new Rectangle( x        , y        , w / 2, h / 2 );    
        let neRect = new Rectangle( x + w / 2, y        , w / 2, h / 2 );    
        let swRect = new Rectangle( x        , y + h / 2, w / 2, h / 2 );
        let seRect = new Rectangle( x + w / 2, y + h / 2, w / 2, h / 2 );    
            
        this.northWest = new PointQuadTree( nwRect, this.quadantCapacity );
        this.northEast = new PointQuadTree( neRect, this.quadantCapacity );
        this.southWest = new PointQuadTree( swRect, this.quadantCapacity );
        this.southEast = new PointQuadTree( seRect, this.quadantCapacity );   
    }
    
    // Render the PQT
    render( container ) {
        //Clear 
        while ( container.firstChild ) { container.removeChild( container.lastChild ); }
        //Render self and sub quadrants
        this.subRender( container );
    }
    subRender( container ) {
        //Create and add quadrant div
        let div = Object.assign( document.createElement( "div" ), { className : 'pqtQuadrant' } );
        container.appendChild( div );

        //If divided, render sub quadrants
        if( this.divided ) {
            div.classList.add( "divided" );

            this.northWest.subRender( div );
            this.northEast.subRender( div );
            this.southWest.subRender( div );
            this.southEast.subRender( div );
        }
        

    }

    // Search the PQT for points inside rect `range`
    // Returns array of Points
    query( range ) {    
        let found = [];
        //If range is outside boundaries, return empty
        if(! this.boundary.intersects( range ) ) {
            return [];
        }
        else {
            //Look for point inside self
            for( let P = 0 ; P < this.points.length ; P++ ) {
                if( range.contains( this.points[P] ) ) {
                    found.push( this.points[P] );
                }
            }    
            //Look for points inside sub quadrants
            if( this.divided ) {                     
                found = found.concat( this.northWest.query( range ) );
                found = found.concat( this.northEast.query( range ) );
                found = found.concat( this.southWest.query( range ) );
                found = found.concat( this.southEast.query( range ) );
            }
        
        }

        return found;
    }
  
}   
