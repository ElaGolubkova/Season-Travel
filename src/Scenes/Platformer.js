class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
        this.coinsCollected = 0;
        this.coinsWin = 150;
    }

    resetGameVariables() {
        this.coinsCollected = 0;
        this.coinText;
    }

    init() {
        // variables and settings
        this.resetGameVariables();
        this.ACCELERATION = 300;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.5;
    }

    create() {
        // Create a new tilemap game object
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.backgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
       
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);


        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Find coins in the "Objects" layer in Phaser
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 515, "platformer_characters", "tile_0004.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.sound.play("collect", {
                volume: 0.1 
             });
            this.coinsCollected += 1; // Count the collected coins
            console.log(`Coins Collected: ${this.coinsCollected}`);
            if (this.coinsCollected >= this.coinsWin) {
                //this.playerWins();
                console.log("Win");
            }
        });
        
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.fKey = this.input.keyboard.addKey('F');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // movement vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_06.png'],
            scale: {start: 0.03, end: 0.1},
            lifespan: 350,
            maxAliveParticles: 10,
            alpha: {start: 1, end: 0.1}, 
            gravityY: -100,
        });

        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['slash_01.png', 'slash_02.png'],
            scale: {start: 0.09, end: 0.15},
            lifespan: 350,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        my.vfx.jumping.stop();

        this.add.bitmapText(90, 560, 'Game2Font', 'Welcome to the game!', 25).setOrigin(0.5);
        this.add.bitmapText(85, 600, 'Game2Font', 'Use Arrows to move < >', 25).setOrigin(0.5);
        this.add.bitmapText(75, 640, 'Game2Font', 'collect 150 coins!', 25).setOrigin(0.5);
        this.coinText = this.add.bitmapText(1900, 650, 'Game2Font', 'Coins:' + this.coinsCollected + "/" + this.coinsWin, 32).setOrigin(0.5);
        this.add.bitmapText(1850, 620, 'Game2Font', "Press  F  to deposit coins", 32).setOrigin(0.5);


        //Camera code
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); 
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE); 
    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

            // Particle following code 
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
             // Particle following code 
             my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
             my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
 
             // Only play smoke effect if touching the ground
             if (my.sprite.player.body.blocked.down) {
                 my.vfx.walking.start();
             }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        this.coinText.setText('Coins: ' + this.coinsCollected + "/" + this.coinsWin);

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.jumping.stop();
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumping.start();
            this.sound.play("jump", {
                volume: 0.3 
             });
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        
        if(Phaser.Input.Keyboard.JustDown(this.fKey)) {
            if (this.coinsCollected >= this.coinsWin) {
                console.log("You won!!!");
                this.scene.start('Win');
            }
        }
    }
}