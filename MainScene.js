class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
        // Username, implement later
        this.username = "";
        // Player object
        this.player = null;
        this.dying = false;
        // Speed of the player
        this.plySpd = 400;
        // Joystick object
        this.joystick = null;
        // Shooting variables
        this.shooting = false;
        this.lastShot = 0;
        // Time between player shots in ms 
        this.shotTimeout = 1000;   //originally 250
        // Lists of stuff
        this.enemies = [];
        this.bullets = [];  //  from enemy
        this.pBullets = []; //  from player
        this.bulletEnemyCollider = null;
        this.bulletPlayerCollider = null;
        this.enemyPlayerCollider = null;
        // Timing of enemy spawns
        this.lastSpawned = 0;
        this.startingSpawnTime = 5000;
        this.spawnTime = 5000; 
        this.minSpawnTime = 1000;
        // Variable to mark if the game is over
        this.gameOver = false;
        // Score counter
        this.score = 0;
        this.scoreText = null;
        // Firebase stuff
        this.database = firebase.firestore();
        this.scoreTable = this.database.collection('scores');
    }

    init(data) {
        // Get the username from the title screen
        this.username = data.username;
        if (this.username == "") {
            // No username was provided
            this.username = "KUK";
        }
    }

    preload() {
        // Spritesheets must also include width and height of frames when loading
        this.load.spritesheet('explosion', './assets/explosion-1.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        // Load the spaceship
        this.load.spritesheet('player', './assets/ship.png', {
            frameWidth: 16,
            frameHeight: 24
        });
        // Load the lasers
        this.load.spritesheet('lasers', './assets/laser-bolts.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        // Loading enemy ships
        this.load.spritesheet('enemy-m', './assets/enemy-medium.png', {
            frameWidth: 32,
            frameHeight: 16
        });
        //  Enemy yellow/orange ship
        this.load.spritesheet('enemy-d', './assets/yellowShip.png', {
            frameWidth: 50,
            frameHeight: 50
        });
         //  Enemy green ship
         this.load.spritesheet('enemy-g', './assets/greenShip.png', {
            frameWidth: 50,
            frameHeight: 80
        });

        //  Loading background image
        this.load.image('background', './assets/Space/PNG/Space_Stars4.png');

        //  Loading music
        this.load.audio('instrumental', './assets/InterstellarCaution.mp3');
    }

    create() {

        //start music
        this.instrumental = this.sound.add('instrumental', {
            volume: 0.3, 
            loops: -1
        });
        this.instrumental.play();

        //Create the background space image
        let background1 = this.add.image(225, 650, 'background');
        background1.setScale(7.5);
        let background2 = this.add.image(225, 200, 'background');
        background2.setScale(7.5);

        // //  Adding my dinos
        // this.enemyD = this.physics.add.sprite(225, 500, 'enemy-g');
        // this.enemyD.setScale(3);
        // this.enemyD.anims.create({
        //     key: 'still', 
        //     frames: this.anims.generateFrameNumbers('enemy-d', {
        //         start: 0,
        //         stop: 0
               
        //     }),
        //     frameRate: 3, 
            
        // });


        // Create the text for keeping track of score
        this.scoreText = this.add.text(225, 10, `${this.score}`, {
            fontSize: '40px'
        });
        // Create player object
        this.createPlayer();
        // A virtual joystick for moving the player
        this.joystick = new VirtualJoystick(this, 60, 740, 50);
        // Set up the shooting controls
        this.createShootingControls();
        // Setup collisions for bullet objects
        this.setCollideBullet();

        // Create explosions (from testing)
        // this.input.on('pointerdown', () => {
        //     let x = this.input.activePointer.x;
        //     let y = this.input.activePointer.y;
        //     // const {x, y} = this.input.activePointer;
        //     this.createExplosion(x, y);
        // });
        // Handle clicks on left or right side of screen
        // this.input.on('pointerdown', () => {
        //     if (this.input.activePointer.x < 220) {
        //         this.player.anims.play('left');
        //         this.player.setVelocity(-this.plySpd, 0);
        //     }
        //     else if (this.input.activePointer.x > 230) {
        //         this.player.anims.play('right');
        //         this.player.setVelocity(this.plySpd, 0);
        //     }
        // });
        // this.input.on('pointerup', () => {
        //     this.player.anims.play('idle');
        //     this.player.setVelocity(0);
        // });
    }

    update() {
        // Update the score text
        this.scoreText.setText(`${this.score}`);
        // Handle player movement
        this.player.setVelocity(this.joystick.joyX() * this.plySpd, 0);
        // If the player is holding the button, shoot
        if (this.shooting && this.now() > this.lastShot + this.shotTimeout) {
            this.createBullet(this.player.x, this.player.y - 80);
            this.lastShot = this.now();
        }
        // Check for spawning enemies
        if (this.now() >= this.lastSpawned + this.spawnTime) {
            this.spawnEnemy();
        }
        // Control the enemy ships
        for (let enemy of this.enemies) {
            enemy.ai.update();
        }
        // End the game if necessary
        if (this.gameOver) {
            this.onGameOver();
        }
        // 2D movement
        // this.player.setVelocity(this.joystick.joyX() * this.plySpd,
        //     this.joystick.joyY() * this.plySpd);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(225, 700, 'player');
        this.player.setScale(4);
        // Create aniamtions for the player
        this.generatePlayerAnimations();
        // Collide the player with world bounds
        this.player.setCollideWorldBounds(true);
        // Start the player in idle
        this.player.anims.play('idle');
    }

    createShootingControls() {
        // Handle shooting on desktop using spacebar
        this.input.keyboard.on('keydown-SPACE', () => {
            this.shooting = true;
        });
        this.input.keyboard.on('keyup-SPACE', () => {
            this.shooting = false;
        });
        // Create a button to shoot with on mobile
        let shootButton = this.add.circle(390, 740, 50, 0xFF0000, 0.4);
        shootButton.setInteractive();
        // When the player hits the button, start shooting
        shootButton.on('pointerdown', () => {
            this.shooting = true;
        });
        // If the player stops clicking, or moves the pointer out of the
        // button, stop shooting
        shootButton.on('pointerup', () => {
            this.shooting = false;
        });
        shootButton.on('pointerout', () => {
            this.shooting = false;
        });
    }

    createBullet(x, y, flipped, aimX, aimY) {
        console.log(`this is flipped: ${flipped}`);
        // Create the sprite object
        let bullet = this.physics.add.sprite(x, y, 'lasers');
        bullet.setScale(4);
        // Create the animation
        bullet.anims.create({
            // Name of the animation
            key: 'bullet',
            // Generate all frame numbers between 0 and 7
            frames: this.anims.generateFrameNumbers('lasers', {
                start: 2,
                end: 3
            }),
            // Animation should be slower than base game framerate
            frameRate: 8,
            repeat: -1
        });
        // Run the animation
        bullet.anims.play('bullet');
        // Set the velocity
        if (flipped) {
            if(aimX && aimY) {      //CHANGED
                bullet.setVelocity(aimX, aimY);
            }
            else {      //CHANGED
                bullet.setVelocity(0, 600);
            }
            //bullet.setVelocity(0, 600);
            bullet.setFlipY(true);

            // Add the bullet to the list of enemy bullets // CHANGED
            this.bullets.push(bullet);
            this.setCollideBullet();
        } else {
            bullet.setVelocity(0, -600);

            // Add the bullet to the list of player bullets //CHANGED
            this.pBullets.push(bullet);
            this.setCollideBullet();
        }
        bullet.setCollideWorldBounds(true);
        // Turning this on will allow you to listen to the 'worldbounds' event
        bullet.body.onWorldBounds = true;
        // 'worldbounds' event listener
        bullet.body.world.on('worldbounds', (body) => {
            // Check if the body's game object is the sprite you are listening for
            if (body.gameObject === bullet) {
                // Destroy the bullet
                bullet.destroy();
            }
        });
        // // Add the bullet to the list of bullets //  CHANGED
        // this.bullets.push(bullet);
        // this.setCollideBullet();
    }

    createEnemy(x, y) {

        let enemyType = null;
        let enemyNum = Math.ceil(Math.random() * 3);
        // pink enemy
        if(enemyNum == 1) {
            enemyType = 'enemy-m';
        }
        //orange enemy
        else if (enemyNum == 2){
            enemyType = 'enemy-d';
        }
        else {
            enemyType = 'enemy-g';
        }

        let enemy = this.physics.add.sprite(x, y, enemyType);

        //resizing enemies
        if(enemyNum == 1) {
            enemy.setScale(3);
        }
        else if (enemyNum == 2){  
            enemy.setScale(2.5);
        }
        else {
            enemy.setScale(1.8);
        }

        // // enemy.setVelocity(0, .25 * this.plySpd);
        // // Idle animation
        // enemy.anims.create({
        //     key: 'idle',
        //     frames: this.anims.generateFrameNumbers('enemy-m', {
        //         start: 0,
        //         end: 1
        //     }),
        //     frameRate: 8,
        //     repeat: -1
        // });
        // // Play idle by default       // ADDED THIS
        // enemy.anims.play('idle');    //  ADDED THIS
        // Explosion animation
        enemy.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', {
                start: 0,
                end: 7
            }),
            frameRate: 8
        });
        // At the end of explosion, die.
        enemy.on('animationcomplete-explode', () => {
            enemy.destroy();
        });
        // // Play idle by default
        // enemy.anims.play('idle');
        // Attach an AI controller to this object

        //  Choosing the AI
        if(enemyNum == 1) {
            enemy.ai = new EnemyM(this, enemy);
        }
        else if (enemyNum == 2){  
            enemy.ai = new EnemyS(this, enemy);
        }
        else {
            enemy.ai = new EnemyZ(this, enemy);
        }

        //enemy.ai = new EnemyS(this, enemy);
        // Add the bullet to the list of enemies
        this.enemies.push(enemy);
        this.setCollideBullet();
        // Rebuild the enemy and player collider
        this.setCollidePlayerEnemy();
    }

    createExplosion(x, y) {
        // Creat the sprite object
        let explosion = this.add.sprite(x, y, 'explosion');
        explosion.setScale(4);
        // Create the animation
        explosion.anims.create({
            // Name of the animation
            key: 'boom',
            // Generate all frame numbers between 0 and 7
            frames: this.anims.generateFrameNumbers('explosion', {
                start: 0,
                end: 7
            }),
            // Animation should be slower than base game framerate
            frameRate: 8
        });
        // Run the animation
        explosion.anims.play('boom');
        // Create a callback for animation
        explosion.on('animationcomplete-boom', () => {
            explosion.destroy();
        });
    }

    generatePlayerAnimations() {
        // Create the idle animation
        this.player.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', {
                frames: [2, 7]
            }),
            frameRate: 12,
            repeat: -1
        });
        // Create left/right animations
        this.player.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', {
                frames: [0, 5]
            }),
            frameRate: 12,
            repeat: -1
        });
        this.player.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', {
                frames: [4, 9]
            }),
            frameRate: 12,
            repeat: -1
        });
        // Explosion animation
        this.player.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', {
                start: 0,
                end: 7
            }),
            frameRate: 8
        });

        // After the player is done exploding, we should have a callback
        this.player.on('animationcomplete-explode', () => { 
            this.onPlayerExploded();
        });
    }

    /**
     * @returns The current time as a ms timestamp
     */
    now() {
        return new Date().getTime();
    }

    /**
     * Runs during update() if the "gameOver" flag has been set.
     * Resets the game.
     */
    onGameOver() {
        // Save the score
        this.saveScore();
        // Reset timers for enemy spawn
        this.lastSpawned = 0;
        this.spawnTime = 5000;
        // Destroy all the stuff
        this.player.destroy();
        for (let e of this.enemies) {
            e.destroy();
        }
        for (let b of this.bullets) {  // for enemy bullets
            b.destroy();
        }
        for (let b of this.pBullets) {  // for enemy bullets
            b.destroy();
        }

        //stop music
        this.sound.stopAll();

        //  Make the shooting equal false
        this.shooting = false;
        // Stop running updates on enemies
        this.enemies = [];
        // Reset the enemy bullets
        this.bullets = [];
        //  Reset the player bullets
        this.pBullets = [];
        // Reset game over variable
        this.gameOver = false;
        // Reset score
        this.score = 0;
        //  Reset is Dying to false
        this.dying = false;
        // Restart the game
        this.scene.start('TitleScene');
    }

    onPlayerExploded() {
        // The game will reset immediately when the player is done exploding.
        // Change this if you want multiple lives...
        this.gameOver = true;
    }

    /**
     * Saves the player's score to the firestore database
     */
    async saveScore() {
        let result = await this.scoreTable.add({
            name: this.username,
            score: this.score
        });
        if (result) console.log("Score saved successfully!");
        else console.log("Score failed to save!");
    }

    setCollideBullet() {
        // Destroy any existing colliders
        if (this.bulletEnemyCollider != null) {
            this.bulletEnemyCollider.destroy();
        }
        if (this.bulletPlayerCollider != null) {
            this.bulletPlayerCollider.destroy();
        }

        // Add collision with all player bullets
        this.bulletEnemyCollider =
            this.physics.add.overlap(this.enemies, this.pBullets,   //CHANGEd
                (en, bu) => {
                    // Increase the player's score
                    this.score++;
                    // Destroy the bullet
                    bu.destroy();
                    // Make the enemy explode
                    en.anims.play('explode');
                    // Make the enemy "float" down
                    en.setVelocity(0, -this.plySpd / 2);
                    // Remove the bullet from the list of bullets
                    this.bullets = this.bullets.filter((b) => {
                        return b !== bu;
                    });
                    // Remove the enemy from the list of enemies
                    this.enemies = this.enemies.filter((e) => {
                        return e !== en;
                    });
                });

            // Add collision with player to all enemy bullets
            this.bulletPlayerCollider =
                this.physics.add.overlap(this.bullets, this.player, // CHANGE back to this.bullets
                    (bullet, player) => {
                        if(this.dying == false) {
                            //Say that the player has been shot
                            this.dying = true;
                            // Destroy the bullet
                            bullet.destroy();
                            // Blow up the player
                            player.anims.play('explode');
                            // Remove the bullet from the list of bullets
                            this.bullets = this.bullets.filter((b) => {
                                return b !== bullet;
                            });
                        }
                    }
                );
        
            
    }

    setCollidePlayerEnemy() {
        // Destroy any existing collision handler
        if (this.enemyPlayerCollider != null) {
            this.enemyPlayerCollider.destroy();
        }
    
        // Create a new collision handler
        this.enemyPlayerCollider =
            this.physics.add.overlap(this.enemies, this.player,
                (en, ply) => {
                    // Explode player and enemy
                    en.anims.play('explode');
                    ply.anims.play('explode');
                    // Set the enemy velocity to "float" down
                    en.setVelocity(0, this.plySpd / 2);
                    // Remove the enemy from the list of enemies
                    this.enemies = this.enemies.filter((e) => {
                        return e !== en;
                    });
                }
            );
    
    }

    /**
     * Spawns an enemy at a random location and sets spawn timer.
     * Different from createEnemy(), which only creates an enemy.
     */
    spawnEnemy() {
        // Pick a random x coordinate without set bounds
        // x will be between 25 and 425
        const x = (Math.random() * 400) + 25;
        // Creates the actual enemy object at the given position
        this.createEnemy(x, 0);
        // Set the spawn timer and time between spawns
        this.lastSpawned = this.now();
        this.spawnTime *= .95;
        // Puts a hard limit on how small spawn time can get
        if (this.spawnTime < this.minSpawnTime) {
            this.spawnTime = this.startingSpawnTime;
            this.startingSpawnTime -= 100;
            this.minSpawnTime -= 8;
        }
        //
        if(this.minSpawnTime < 700) {
            this.minSpawnTime = 1000;
            this.startingSpawnTime = 2000;
        }

        // able to shoot faster after more kills
        if(this.shotTimeout > 100) {
            this.shotTimeout -= 10;
        }
       
    }
}