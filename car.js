class Car{
    constructor(x,y,width,height,controlType,maxSpeed = 3,color="blue"){
        //State
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.damaged = false;

        //Size
        this.width  = width;
        this.height = height;

        //Speed, Acceleration & Friction
        this.speed = 0;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.acceleration = 0.2;

        //Use Nural Network
        this.useBrain = controlType=="AI";

        if(controlType != "DUMMY"){
            //Sensors
            this.sensor = new Sensor(this);
            //Neural Network 1 Hidden Layer
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount,6,4]
            );
        }
        
        //Controlls
        this.controls = new Controls(controlType);

        //Image
        this.img = new Image();
        this.img.src = "car.png"

        this.mask = document.createElement("canvas");
        this.mask.width = width;
        this.mask.height = height;

        const maskCtx=this.mask.getContext("2d");
        this.img.onload=()=>{
            maskCtx.fillStyle=color;
            maskCtx.rect(0,0,this.width,this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation="destination-atop";
            maskCtx.drawImage(this.img,0,0,this.width,this.height);
        }

    }

    update(roadBorders,traffic){
        if(!this.damaged){
            this.#move();
            this.polygon=this.#createPolygon();
            this.damaged=this.#assessDamage(roadBorders,traffic);
        }

        if(this.sensor){
            this.sensor.update(roadBorders,traffic);
            const offsets = this.sensor.readings.map(
                s=>s==null?0:1-s.offset
            );
            
            const outputs = NeuralNetwork.feedForward(offsets,this.brain);

            //Linking AI To Controls
            if(this.useBrain){
                this.controls.forward=outputs[0];
                this.controls.left=outputs[1];
                this.controls.right=outputs[2];
                this.controls.reverse=outputs[3];
            }
        }
        
    }

    #assessDamage(roadBorders,traffic){
        //
        for(let i=0;i<roadBorders.length;i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }
        //
        for(let i=0;i<traffic.length;i++){
            if(polysIntersect(this.polygon,traffic[i].polygon)){
                return true;
            }
        }
        return false;
    }
  
    //Create The Car Edges
    #createPolygon(){
        const points = [];
        const rad   = Math.hypot(this.width,this.height)/2;
        const alpha = Math.atan2(this.width,this.height);
        //Push The Points
        points.push({
            x:this.x - Math.sin(this.angle - alpha)*rad,
            y:this.y - Math.cos(this.angle - alpha)*rad
        });
        points.push({
            x:this.x - Math.sin(this.angle + alpha)*rad,
            y:this.y - Math.cos(this.angle + alpha)*rad
        });
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle - alpha)*rad,
            y:this.y - Math.cos(Math.PI + this.angle - alpha)*rad
        });
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle + alpha)*rad,
            y:this.y - Math.cos(Math.PI + this.angle + alpha)*rad
        });

        return points;
    }

    //Private Method Move
    #move(){
        //Forward and Reverse
        if(this.controls.forward){
            this.speed += this.acceleration;
        }else if(this.controls.reverse){
            this.speed -= this.acceleration;
        }
        //Speed Limits
        if(this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }else if(this.speed < (-this.maxSpeed/2)){
            this.speed = (-this.maxSpeed/2);
        }
        //Friction
        if(this.speed > 0){
            this.speed -= this.friction;
        }else if(this.speed < 0){
            this.speed += this.friction;
        }

        if(Math.abs(this.speed) < this.friction){
            this.speed = 0;
        }

        //Left and Right
        if(this.speed != 0){
            const flip = this.speed>0?1:-1;
            if(this.controls.left){
                this.angle += 0.03*flip;
            }else if(this.controls.right){
                this.angle -= 0.03*flip;
            }
        }
        

        //POS
        this.x -= Math.sin(this.angle)*this.speed;
        this.y -= Math.cos(this.angle)*this.speed;
    }

    draw(ctx,drawSensor=false){
       

        /*if(this.damaged){
            ctx.fillStyle = "gray";
        }else{
            ctx.fillStyle = color;
        }
        //Draw Car
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x,this.polygon[0].y);
        for(let i=1; i<this.polygon.length; i++){
            ctx.lineTo(this.polygon[i].x,this.polygon[i].y);
        }
        ctx.fill();*/

        //Draw Sensors
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }
        
        //Car
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(-this.angle);
        if(!this.damaged){
            ctx.drawImage(this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height);
            ctx.globalCompositeOperation="multiply";
        }
        ctx.drawImage(this.img,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height);
        ctx.restore();


    }
}