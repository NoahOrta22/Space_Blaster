class EnemyS extends AI {
    constructor(scene, obj) {
        super(scene, obj, () => { });
        this.change(this.moveDown);
        this.bulletSpeed = this.scene.plySpd
        this.accel = 200; //accelerates the ship
        this.lastShot = 0;
        this.shotTimeout = 6000;
        this.bullets = 3;
    }

    moveDown() {
        this.obj.setVelocity(0, .25 * this.scene.plySpd);
        // Check if we should change states
        if ((this.scene.player.y - this.obj.y) < 600) {
            this.change(this.stopped); 
        }
    }

    stopped() {
        //stop the enemy ship 
        this.obj.setVelocity(0, 0);

        //find the player ship
        // this.scene.physics.moveToObject(this.obj, this.scene.player, this.plySpd * .25);
        let angle = Phaser.Math.Angle.BetweenPoints(this.obj, this.scene.player);
        let xSpd = Math.cos(angle) * this.bulletSpeed;
        let ySpd = Math.sin(angle) * this.bulletSpeed;

        // Check if we should shoot
        if (this.now() > this.lastShot + this.shotTimeout) {
            this.scene.createBullet(this.obj.x, this.obj.y + 50, true, xSpd, ySpd);
            this.lastShot = this.now(); 
            this.bullets--;
            this.bulletSpeed += 300;
            if (this.bullets == 1) {
                this.bulletSpeed = 1700;
            }
        }

        //if out of bullets
        if (this.bullets <= 0) {
            this.change(this.charge);
        }
    }

    charge() {
       
        setInterval(() => {
            this.accel *=2;
        }, 1000);

        this.obj.setVelocity(0, this.accel);
        
    }

    now() {
        return new Date().getTime();
    }
}