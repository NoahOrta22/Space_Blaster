class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
        this.scoresText = null;
        this.username = "";
        // Firebase stuff
        firebase.initializeApp(firebaseConfig);
        firebase.analytics();
        this.database = firebase.firestore();
        this.scoreTable = this.database.collection('scores')
            .orderBy('score', 'desc')
            .limit(10);
        // HTML stuff
        this.nameInput = null;
        /** @type {HTMLInputElement} */
        this.element = null;
    }

    preload() {
        //  Loading the title pic
        this.load.image('titlePic', './assets/Space/PNG/Space_Stars1.png');;

        //  Loading the dino sprite
        this.load.spritesheet('dino', './assets/Dinos/sheets/DinoSprites - vita.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        this.load.spritesheet('dino2', './assets/Dinos/sheets/DinoSprites - doux.png', {
            frameWidth: 24,
            frameHeight: 24
        });

        //  Loading music
        this.load.audio('instrumental1', './assets/InterstellarMain.mp3');
    }

    create() {

        //start music
        this.instrumental1 = this.sound.add('instrumental1', {
            volume: 0.2, 
            loops: -1
        });
        this.instrumental1.play();

        //displaying the title Picture
        let titlePic1 = this.add.image(230, 650, 'titlePic');
        titlePic1.setScale(7.5);
        let titlePic2 = this.add.image(230, 200, 'titlePic');
        titlePic2.setScale(7.5);
        

        //  Adding my dinos
        this.dino = this.physics.add.sprite(225, 700, 'dino');
        this.dino.setScale(5);
        this.dino.anims.create({
            key: 'standing', 
            frames: this.anims.generateFrameNumbers('dino', {
                //frames: [0, ]
                start: 0,
                end: 3
            }),
            frameRate: 10, 
            repeat: -1
        });
        this.dino.anims.play('standing');

        //starts the running dino animatino
        this.runningDino();

        let button = this.add.rectangle(225, 600, 340, 70, 0x00FF00, 0.3);
        button.setInteractive();
        button.on('pointerdown', () => {
            clearInterval(this.timer);
            this.sound.stopAll();
            this.scene.start('MainScene', {
                username: this.username
            });
        });
        this.add.text(225, 600, "PLAY!", {
            fontSize: '40px'
        }).setOrigin(0.5);

        // Text for the high score table
        this.scoresText = this.add.text(340, 10, "", {
            fontSize: '25px',
            align: 'right'
        }).setOrigin(1, 0);
        // Run our database query to get scores
        this.getAllScores();

        // Create an input element for username
        this.nameInput = this.add.dom(225, 400, 'input');
        this.nameInput.setScale(2);
        this.element = this.nameInput.node;

        //  timer for the running dino
        this.timer = setInterval(() => {
            this.runDino.destroy();
            this.runningDino();
        }, 6000);
    }

    update() {
        this.username = this.element.value;

    }

    runningDino() {
        this.runDino = this.physics.add.sprite(-100, 150, 'dino2');
            this.runDino.setScale(5);
            //  Create animation
            this.runDino.anims.create({
                //Name of animation
                key: 'run',
                frames: this.anims.generateFrameNumbers('dino2', {
                    start: 4,
                    end: 9
                }),
                frameRate: 8, 
                repeat: -1
            });
            this.runDino.anims.play('run');
            this.runDino.setVelocity(200, 0);
    };

    async getAllScores() {
        let snap = await this.scoreTable.get();
        snap.forEach(
            (docSnap) => {
                const data = docSnap.data();
                // const name = data.name;
                // const score = data.score;
                const { name, score } = data;
                let scoreString = `${score}`.padStart(5, ' ');
                this.scoresText.text += `${name}: ${scoreString}\n`;
            }
        );
    }
}

