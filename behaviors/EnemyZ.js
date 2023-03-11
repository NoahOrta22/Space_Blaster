class EnemyZ extends AI {
    constructor(scene, obj) {
        super(scene, obj, () => { });
        this.change(this.moveDown);
        this.strafing = false;
        this.speed = this.scene.plySpd; //this.scene.plySpd
        this.zag = false;
        this.lastShot = 0;
        this.shotTimeout = 3000;
        this.bullets = 4;
    }

    moveDown() {
        
        this.obj.setVelocity(0, .45 * this.speed);
        // Check if we should change states
        if ((this.scene.player.y - this.obj.y) < 275) {
            this.change(this.strafe);
        }
    }

    strafe() {

        this.speedUp = setInterval(() => {
            this.speed += 1;
        }, 3000);

        //  If this state just started go up 150 pixels
        if (!this.strafing) {
            this.strafing = true;
            // Go up
            this.obj.setVelocity(0, -this.speed * .5);
        }
        
        if((this.scene.player.y - this.obj.y) > 325 && this.strafing == true) {

            //if the zig zag hasn't started, start it
           if(!this.zag) {
                this.obj.setVelocity(-this.speed * .1, 0);
                this.zag = true
           }

            // If on the left side of the screen, go right
            if (this.obj.x < 100) {
                this.obj.setVelocity(.25 * this.speed, -.01 *this.speed);
            }
            // If on the right side of the screen, go left
            else if (this.obj.x > 350) {
                this.obj.setVelocity(-.25 * this.speed, -.01 *this.speed);
            }

            //  If at top of screen go back down
            if ((this.scene.player.y - this.obj.y) > 675) {
                this.zag = false;
                this.strafing = false;
                this.change(this.moveDown);
            } 
                  
        }

       

        // Check if we should shoot
        if (this.now() > this.lastShot + this.shotTimeout) {
            this.scene.createBullet(this.obj.x, this.obj.y + 50, true);
            this.lastShot = this.now();
            this.bullets--;
        }

        // // If out of bullets, change state
        // if (this.bullets <= 0) {
        //     this.strafing = false;
        //     this.change(this.charge);
        // }
    }

    charge() {
        // this.scene.physics.moveToObject(this.obj, this.scene.player, this.plySpd * .25);
        let angle = Phaser.Math.Angle.BetweenPoints(this.obj, this.scene.player);
        let xSpd = Math.cos(angle) * this.speed * .25;
        let ySpd = Math.sin(angle) * this.speed * .25;
        this.obj.setVelocity(xSpd, ySpd);
        if(this.obj.y > this.scene.player.y){
            this.obj.y = 0;
            this.bullets = 5;
            this.change(this.moveDown);
        }
    }

    now() {
        return new Date().getTime();
    }
}