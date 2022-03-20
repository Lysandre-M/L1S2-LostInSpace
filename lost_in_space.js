"use strict";
// Globaux

// variables canvas
var canvas, context, game_area;
var X, Y;

// variables paramètres
const refresh_time = 50; // (millisecondes)
const cadence_tir = 500; // (millisecondes)
var tir = true;
var last_shot, dash_time;
var shots = [];

var lst_events = {}; 
var times = [];

var Max_aliens = 250;
var nb_aliens, kill_count;
var nb_vies = 3;
var star_bonus = false;
var boss = false;

// variables objets
var you, balls, aliens, bonuses;
var Neko_chan;

// variables boutons
var play_button, set_button, quit_button, help_button;
var pause_button;
var in_settings = false;
var in_help = false;

// variables images
var heart = new Image();
heart.src = "images/heart1.png";
var background = new Image();
background.src = "images/downloaded_background.png";

var titre = new Image();
titre.src = "images/game_title.png";

// variables audio
var game_audio;
var menu_audio;
var bruitage_1;
var bruitage_2;
var bruitage_3;

//variables options
var move_cursor = false;



// Menus

function set_buttons() {
	canvas = document.getElementById("game_area");
  	context = canvas.getContext("2d");
  	X = canvas.width;
 	Y = canvas.height;

 	help_button = document.getElementById("help");
	play_button = document.getElementById("play");
    set_button = document.getElementById("set");
    quit_button = document.getElementById("quit");
    pause_button = document.getElementById("pause");
}


function set_audios() {
	menu_audio = document.getElementById("music_1");
    game_audio = document.getElementById("music_2");

    bruitage_1 = document.getElementById("sound_1");
    bruitage_2 = document.getElementById("sound_2");
    bruitage_3 = document.getElementById("sound_3");
}


function onload() {

		set_buttons();
		set_audios();
		document.cookie = "SameSite=Strict";
		game_area = canvas.getBoundingClientRect();

       	context.clearRect(0, 0, X, Y);
		reset_game();

		window.addEventListener("keydown", press_key , false);

		context.drawImage(titre, X / 2 - titre.width / 2, Y / 2 - titre.height / 2);

  	play_button.onclick = function () {
  		if (play_button.innerHTML == "PLAY") { fade_black(); }
      	play_button.innerHTML = "RESTART";
      	window.removeEventListener("keydown", press_key , false);
        window.setTimeout(start, 3000);
  	}

	set_button.onclick = function () {
		settings();
	}

	quit_button.onclick = function () {
		quit();
	}

	help_button.onclick = function () {
      	help_menu();
      }
}


// Constructeurs 

class Space_Thing {

	constructor(x, y, vx, vy, src) { 
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;

		this.img = new Image();
		this.img.src = src;
		this.lives = 1; 
	}

	draw() { 
		context.drawImage(this.img, this.x - this.img.width / 2, this.y - this.img.height / 2); 
	}

	step() {
		this.x += this.vx * refresh_time / 100;
		this.y += this.vy * refresh_time / 100;
	}
}

class Spaceship extends Space_Thing {
	constructor() {
		super(X / 2, Y * 9 / 10, 0, 0, "images/spaceship.png");	
		this.lives = 3;
		this.touched = false;
	}

	move() {
		this.step();
		// ne peut pas sortir du canvas 
		if (this.x > X - this.img.width / 2) { this.x = X - this.img.width / 2; } 
		if (this.x < this.img.width / 2) { this.x = this.img.width / 2; }
		if (this.y > Y - this.img.height / 2) { this.y = Y - this.img.height / 2; }
		if (this.y < this.img.height / 2) { this.y = this.img.height / 2; }
	}
}


class Alien extends Space_Thing {
	constructor(left, y, name = "") {
		super(X * !left, y, (1 * left - 1 * !left) * 10, 4, "images/alien11.png")

		this.left_side = left;
		this.entry = y;
		this.count = 0; //compteur de frame pour les éventuelles animations
		this.name = name;
	}

	move() {
		this.step();

		if (this.y > Y || this.y < 0) { // rebondit sur le haut et le bas du canvas
			this.vy = - 1.1 * this.vy;
			if (Math.abs(this.vy) > 50) { this.vy = 50 * this.vy / Math.abs(this.vy); }
		}
	}

	adjust() { 
		if (this.x > 2 * X || this.x < -X) { // revient au bout d'un certain temps lorsqu'il sort par les côtés
				this.x = !this.left_side * X;
				this.y = this.entry; 
		}
	}

	show() {
		if (this.lives > 0) {
			this.draw(); 
			this.count += 0.2;}

	}

	animate(count, n_sprite) {
		let sprite = parseInt(count, 10)%n_sprite;
		this.img.src = "images/"+this.name+"/sprite_"+sprite+".png";
	}
}


class Big_Alien extends Alien {
	constructor(left, y) {
		super(left, y);
		this.img.src = "images/alien1.png"
		this.lives = 2;

		this.vx /= 3;
		this.vy /= 2;
	}
}


class Speedy_Alien extends Alien {
	constructor(left, y) {
		super(left, y);
		this.img.src = "images/alien22.png"

		this.vx = (you.x - this.x) / 20;
		this.vy = (you.y - this.y) / 20;
	}

	adjust() {

		if (this.x > 2 * X || this.x < -X) { // revient au bout d'un certain temps lorsqu'il sort par les côtés

			this.x = !this.left_side * X;
			this.y = this.entry; 

			this.vx = (you.x - this.x) / 20;
			this.vy = (you.y - this.y) / 20;
		}
	}
}


class Super_Alien extends Alien {
	constructor(left, y) {
		super(left, y);
		this.img.src = "images/alien3.png";

		this.vx *= 2.5;
		this.vy *= 2.5;

		this.lives = 3;
	}

}

class Boss extends Alien {
	constructor() {
		super(NaN, 0);

		this.img = new Image();
		this.img.src = "images/Neko_chan/sprite_0.png";
		this.name = "Neko_chan"

		this.x = X / 2;
		this.y = - this.img.height;

		this.vx = 2;
		this.vy = 1;

		this.lives = 70;
	}

	adjust() {
		if (this.y >= this.img.height / 2  + 10) { this.vy = 0; }
		if (this.x <= this.img.width / 2 || this.x >= X - this.img.width / 2) { this.vx *= -1; }
	}
}


class Ball {
	constructor(color) {
	 	this.x = you.x; 
		this.y = you.y;
		this.vx = 0;//2 * you.vx;
		this.vy = -16;//2 * you.vy;


		this.color = color;
		this.opacity = 10;
	}

	move() {
		this.y += this.vy * refresh_time / 100;
		this.vy *= 0.99;
		this.opacity *= 0.94;
	}

	draw() {
	    context.lineWidth = 2;
	    context.strokeStyle = "rgba(200, 200, 200," + this.opacity + ")";

	    context.stroke

	    context.fillStyle = "rgba(" + this.color + ',' + this.opacity + ")";

	    context.beginPath();
  	    context.arc(this.x, this.y, 7, 0, 2 * Math.PI);
	    context.stroke();
	    context.fill();
	}
}

class Object {
	constructor(src) {
		this.x = 10 + Math.random() * (X - 20);
		this.y = 10 + Math.random() * (Y - 20);
		this.img = new Image();
		this.img.src = src; 
	}
	draw() {
		context.drawImage(this.img, this.x - this.img.width / 2, this.y - this.img.height / 2); 
	}
}


class Life extends Object {
	constructor() {
		super("images/heart1.png");
		this.x = X / 2;

		this.type = "heart";
	}
}


class Star extends Object {
	constructor() {
		super("images/star.png");

		this.type = "star";
	}
}


// Auxilliaires

function distance(xa, ya, xb, yb) { return Math.sqrt((xa - xb)**2 + (ya - yb)**2); }

function new_things() { 
	let s =  Math.random();
	let y = Math.random() * Y;

  		if (nb_aliens < Max_aliens) {

	  		if ( s > 0.5 && nb_aliens >= Max_aliens / 3) {
	  				aliens.push( new Speedy_Alien(tir, y) ); 
	  				nb_aliens += 1;
	  		}

	  		else if ( (s < 0.2 && kill_count >= Max_aliens / 5) ) {
	  				aliens.push( new Super_Alien(tir, y) );
	  				nb_aliens += 3;
	  		}

	  		else if (s > 0.45 || nb_aliens <= 6) {
	  				aliens.push( new Alien(true, y) ); 
	  				aliens.push( new Alien(false, y) );
	  				nb_aliens += 2;
	  		}

	  		else if (nb_aliens >= Max_aliens / 5) {
	  				aliens.push( new Big_Alien(true, y) ); 
	  				aliens.push( new Big_Alien(false, y) );
	  				nb_aliens += 4;
	  		}
	  	}

	  	if (s < 0.1 && nb_aliens >= 6) { 
	  		bonuses.push( new Life() );
	  		window.setTimeout(function() { bonuses.shift(); }, 4000 )
	  	} 

	  	if (s > 0.9 && nb_aliens >= 10) {
	  		bonuses.push( new Star() );
	  		window.setTimeout(function() { bonuses.shift(); }, 6000 )
	  	}

	  	if (!boss && kill_count > 4 * Max_aliens / 5) { Neko_chan = new Boss(); boss = true; }
}


function set_times() {
	times[0] = window.setInterval(affichage, refresh_time);
  	times[1] = window.setInterval(events, refresh_time);
  	times[3] = window.setInterval(new_things, 2500);
}


function play_pause(bool) {
	if (play_button.innerHTML == "PLAY") { return; }

	if (bool) {
		for (let i = 0; i < times.length; i++) { clearInterval(times[i]) }
		pause_button.innerHTML = "▷";
		game_audio.pause();
	}
	else {
  		set_times();
		pause_button.innerHTML = "II";
		game_audio.play();
		in_settings = false;
		in_help = false;
	}
	pause_button.blur();
	return times;
}


function press_key() { 
	//context.clearRect(0, 0, X, Y);
	menu_audio.play();
}


// Dessinateurs

function fade_black() {
	let vol = menu_audio.volume;
	let i = 0;

	function blackRect() {
		if (i == 101) { 
			fading = window.clearInterval(); 
			menu_audio.pause();
			menu_audio.volume = vol;
			//reset_game();
			return; 
		}

		menu_audio.volume = Math.min(Math.max(1 - i / 50, 0), vol);
		context.fillStyle = "rgba(0, 0, 0," + (i / 100) + ")";
		context.fillRect(0, 0, X, Y);
		i++;
	}
	let fading = window.setInterval(blackRect, refresh_time);

	//game_audio.volume = vol;
}


function affiche_vies() {
 	for(var i=0; i < you.lives; i++) {
 		context.drawImage(heart, 40 + 35 * i, 35);
 	}
}


function affiche_compteur() {
	context.strokeStyle = "#FFFFFF";
	context.font = "16px courier";
	context.lineWidth = 2;
	context.strokeText(parseInt(kill_count) + " / " + parseInt(Max_aliens), X / 2, Y / 10);
}


function affiche_shots() {
	var shot = new Image();
	shot.src = "images/shot.png";
	for (let i= 0; i < shots.length; i++) {
		let x = shots[i][0];
		let y = shots[i][1];
		context.drawImage(shot, x - shot.width / 2, y - shot.height / 2);
	}

}


function affichage() {
	if (you.lives > 0) { collisions(); }
	context.clearRect(0, 0, X, Y);
	context.drawImage(background, 0, 0)
		
		if (you.lives > 0) { balls.forEach(function(ball) { ball.move(); ball.draw() }); }
		aliens.forEach(function(alien) { alien.move(); alien.show(); alien.adjust(); });
		bonuses.forEach(function(bonus) { bonus.draw() });
		you.move();
		if (you.lives > 0) { you.draw(); }

		affiche_vies();
		if (kill_count >= Max_aliens) { 
			let win_game = new Image();
			win_game.src = "images/you_win.png";
			context.drawImage(win_game, X / 2 - win_game.width / 2, Y / 2 - win_game.height / 2);
		}

		if (boss) { Neko_chan.animate(Neko_chan.count, 4); Neko_chan.show(); Neko_chan.move(); Neko_chan.adjust();}
		affiche_compteur();
		affiche_shots();

		if (you.lives <= 0) {
			game_audio.pause();
			let lose_game = new Image();
			lose_game.src = "images/game_over.png";
			context.drawImage(lose_game, X / 2 - lose_game.width / 2, Y / 2 - lose_game.height / 2);
		}

		for (let i = 0; i < aliens.length; i++) {
			if (aliens[i].lives <= 0) { aliens.splice(i, 1); break; }
		}
}


// Exécuteurs

function reset_game() {
	for (let i = 0; i < times.length; i++) { clearInterval(times[i]) }
	balls = []; 
	aliens = [];
	bonuses = [];

	last_shot = 1000;
	dash_time = 0;
	nb_aliens = 0;
	kill_count = 0;
	lst_events = [];
	boss = false;
	in_settings = false;
	in_help = false;

	context.clearRect(0, 0, X, Y);
	play_button.blur();
	pause_button.innerHTML = 'II';
}


function start() {
	reset_game();
	console.log("Partie lancée !")

 	you = new Spaceship();

	game_audio.load();
  	game_audio.play();

 	set_times();
	pause_button.onclick = function() { times = play_pause(pause_button.innerHTML == 'II') }

}


function settings() {
	context.clearRect(0, 0, X, Y);
	if (in_settings && play_button.innerHTML == "PLAY") {
		context.drawImage(titre, X / 2 - titre.width / 2, Y / 2 - titre.height / 2);
		in_settings = false;
		set_button.blur();
		return;
	}

	in_settings = true;
	in_help = false;
	play_pause(pause_button.innerHTML == 'II');
	set_button.blur();

	context.strokeStyle = "#FFFFFF";
	context.font = "32px courier";
	context.strokeText("SETTINGS", (X / 2) - 70, Y / 10);

	let curseur_musique = new Cursor("Music", game_audio.volume * 100, Y / 5);
	let curseur_sons = new Cursor("Sound Effects", bruitage_1.volume * 100, 2 * Y / 5);

	curseur_musique.draw();
	curseur_sons.draw();

	curseur_musique.listen_mouse();
	curseur_sons.listen_mouse();

/*	curseur_musique.clear(); 
	curseur_sons.clear();*/
}


function quit() {
	if ( confirm("Es-tu sûr.e de vouloir fermer ton onglet ? \n Tu risques de perdre ta progression non sauvegardée.") ) {
	window.close();
	}
	quit_button.blur();
	//Ce bouton est très utile, je ne vois pas du tout ce que tu veux dire.
}


// Gestion d'évènements

let keys = function events() {
    if (event.code == 'KeyA') {
    	if (event.type == 'keydown') {
    		lst_events[event.code] = !lst_events[event.code]
    	}
    }
    else {
    	lst_events[event.code] = (event.type == 'keydown');
    }
}

window.onkeydown = keys;
window.onkeyup = keys;


function events() {
		// mouvements
	  let sensibility = 0.1;
	  if (lst_events["ShiftRight"] || lst_events["ShiftLeft"]) { 
	  		if (dash_time < 800) { sensibility *= 2; dash_time += refresh_time; }
	  }

	  if (lst_events["ArrowLeft"])  { you.x -= sensibility * refresh_time}      // Vers la gauche
	  if (lst_events["ArrowRight"])  { you.x += sensibility * refresh_time }	// Vers la droite
	  if (lst_events["ArrowUp"])  { you.y -= sensibility * refresh_time }		// Vers le haut
	  if (lst_events["ArrowDown"])  { you.y += sensibility * refresh_time }		// Vers le bas

	  	// actions
	  if (lst_events["Space"] && you.lives > 0 && !star_bonus)  { if (last_shot > cadence_tir) { 
	  									balls.push( new Ball("255, 80, 80") ); 
	  									last_shot = 0;
	  									if (tir) { bruitage_1.play(); }
	  									else { bruitage_2.play(); }
	  									tir = !tir;
	  									window.setTimeout( balls.shift, 2000);
	  								} 
	  }
	  if (lst_events['KeyA'] || star_bonus)  { 
	  									balls.push( new Ball("116, 208, 241") );
	  									window.setTimeout( balls.shift, 2000) 
	  }

	  last_shot += refresh_time;
	  if (dash_time >= 800) { window.setTimeout( function() { dash_time = 0; }, 5000); }
}


function collisions() {
	// entre les aliens et les boules
	for (let i = 0; i < aliens.length; i++) {
		for (let j = 0; j < balls.length; j++) { // entre les aliens et les boules
			if (aliens[i].lives != 0 && distance(aliens[i].x, aliens[i].y, balls[j].x, balls[j].y) < 20 && balls[j].opacity > 0.6) { 
				kill_count += 1;
				shots.push([aliens[i].x, aliens[i].y]);
				window.setTimeout( function() { shots.shift(); }, 500 );
				aliens[i].lives -= 1;
				balls[j].opacity = 0;
			}
			if (boss) {
				if (Neko_chan.lives > 0 && distance(Neko_chan.x, Neko_chan.y, balls[j].x, balls[j].y) < 150 && balls[j].opacity > 0.6) {
					shots.push([balls[j].x, balls[j].y]);
					window.setTimeout( function() { shots.shift(); }, 500 );
					Neko_chan.lives -= 1;
					balls[j].opacity = 0;
				}
			}
		}

		if (aliens[i].lives != 0 && distance(aliens[i].x, aliens[i].y, you.x, you.y) < 20) {
			nb_aliens -= aliens[i].lives;
			aliens[i].lives = 0;
			if (!you.touched) {
				you.lives -= 1;
				you.touched = true; //le vaisseau est rouge pdt 700ms
				you.img.src = "images/spaceship_red.png";
				window.setTimeout(function() { you.touched = false; you.img.src = "images/spaceship.png"; }, 700);
			}
		}
	}

	for (let i = 0; i < bonuses.length; i++) {
		if (distance(bonuses[i].x, bonuses[i].y, you.x, you.y) < 20) {
			if (bonuses[i].type == "heart") {
				you.lives += 1;
				bonuses.splice(i, 1);
				break;
			}

			if (bonuses[i].type == "star") {
				bruitage_3.play();
				window.setTimeout( function() { star_bonus = true; }, 300);
				window.setTimeout( function() { star_bonus = false; }, 7000);
				bonuses.splice(i, 1);
				break;
			} 
		}
	}

	if (boss) { 
		if (Neko_chan.lives > 0 && distance(Neko_chan.x, Neko_chan.y, you.x, you.y) < 150) {
			you.lives = 0;
		}
	}
	kill_count = Math.min(kill_count, Max_aliens);
}


// Menu Options

class Cursor {
	constructor(str, percent, y) {
	 	this.name = str;
	 	this.move = false;

	 	this.value = percent;

	 	this.x = percent * X / 200;
		this.y = y;
	}

	draw(color) {
		context.strokeStyle = "purple";
		context.font ="20px courier";
		context.lineWidth = 1;
		context.strokeText(this.name, X / 4, this.y - 25);

		context.lineCap = "round";
		context.lineWidth = 12;
		context.beginPath();
		context.moveTo(X / 4, this.y);
		context.lineTo(3 * X / 4, this.y);
		context.stroke();

		context.lineWidth = 6;
		context.strokeStyle = "white";
		context.beginPath();
		context.moveTo(X / 4, this.y);
		context.lineTo(3 * X / 4, this.y);
		context.stroke();

		context.clearRect(X / 4 + this.x - 5, this.y - 5, 10, 10);
		context.strokeStyle = "purple";
		context.lineWidth = 6;
		context.beginPath();
		context.arc(X / 4 + this.x, this.y, 5, 0, 2*Math.PI);
		context.stroke();
		context.lineWidth = 1;
		context.strokeText(this.value + "%", X / 4 + this.x, this.y + 20)
	}

	option() {
		if (this.name == "Music") { 
			menu_audio.volume = this.value / 100;
			game_audio.volume = this.value / 100;
		}

		if (this.name == "Sound Effects") { 
			bruitage_1.volume = this.value / 100;
			bruitage_2.volume = this.value / 100;
			bruitage_3.volume = this.value / 100;
		}
	}


	mouse_down(mouse) {
		let x_mouse = mouse.clientX - game_area.left;
		let y_mouse = mouse.clientY- game_area.top;
		this.move = false;
		if ( X / 4 <= x_mouse && x_mouse<= 3 * X / 4 ) {
			if ( this.y - 20 <= y_mouse && y_mouse <= this.y + 20 ) {
				this.move = true;
			} 
		}
	}

	mouse_move(mouse) {
		if (this.move && in_settings) {
			let x_mouse = mouse.clientX - game_area.left;
			let y_mouse = mouse.clientY- game_area.top;

			if ( X / 4 <= x_mouse && x_mouse <= 3 * X / 4 ) {
				if ( this.y - 20 <= y_mouse && y_mouse <= this.y + 20 ) {
					 this.x = x_mouse - X / 4;
					 this.value = Math.round(200 * this.x / X);
				}
			}
		}
		if (in_settings) {
			context.clearRect(X / 4 - 10, this.y - 10, X / 2 + 100, 40);
			this.draw();
			this.option();
		}
	}

	mouse_up() { this.move = false; }

	listen_mouse() {
		window.addEventListener("mousedown", mouse => this.mouse_down(mouse) );
		window.addEventListener('mousemove', mouse => this.mouse_move(mouse) );
		window.addEventListener('mouseup', this.mouse_up() );
	}

	/*clear() {
		window.removeEventListener("mousedown", mouse => this.mouse_down(mouse) );
		window.removeEventListener('mousemove', mouse => this.mouse_move(mouse) );
		window.removeEventListener('mouseup', this.mouse_up() );
	}*/
}


//HELP
var n_pages = 2; //Ce menu permet de naviguer entre plusieurs pages

function help_menu() {
	context.clearRect(0, 0, X, Y);

	if (in_help && play_button.innerHTML == "PLAY") {
		context.drawImage(titre, X / 2 - titre.width / 2, Y / 2 - titre.height / 2);
		in_help = false;
		set_button.blur();
		return;
	}

	in_help = true;
	in_settings = false;
	play_pause(pause_button.innerHTML == 'II');
	help_button.blur();
	var margin = X/15;
	var second_col = X/2;
	var line_height = Y/20;
	var page = 1;
	
	aff_page_1(margin, second_col, line_height);
	aff_titre();
	tourne_page(margin, second_col, line_height);
}

function aff_titre() {
	context.strokeStyle = "#FFFFFF";
	context.font = "32px courier";
	context.strokeText("HELP", (X / 2) - 20, Y / 10);
}

function aff_fleches(page) {
	if (page == 1) {
		let next = page + 1;
		context.strokeStyle = "#6D0000";
		context.font = "32px courier";
		context.strokeText("<", (X / 2) - 15, (15*Y)/16);

		context.strokeStyle = "red";
		context.strokeText(">", (X / 2) + 15, (15*Y)/16);

		context.strokeStyle = "red";
		context.font = "10px courier";
		context.strokeText("press ➡️ to go to page "+next, (X / 1.7), (15*Y)/16 - 7);
	}

	else if (page == n_pages) {
		let prev = page - 1;
		context.strokeStyle = "red";
		context.font = "32px courier";
		context.strokeText("<", (X / 2) - 15, (15*Y)/16);

		context.strokeStyle = "#6D0000";
		context.strokeText(">", (X / 2) + 15, (15*Y)/16);

		context.strokeStyle = "red";
		context.font = "10px courier";
		context.strokeText("press ⬅️ to go to page "+prev, X/4.5, (15*Y)/16 - 7);
	}

	else {
		context.strokeStyle = "red";
		context.font = "32px courier";
		context.strokeText("<", (X / 2) - 15, (15*Y)/16);
		context.strokeText(">", (X / 2) + 15, (15*Y)/16);
	}
}

function aff_page_1(margin, second_col, line_height) {
	context.clearRect(0, 0, X, Y);

	context.strokeStyle = "purple";
	context.font = "25px courier";
	context.strokeText("How to play", margin, Y / 5);
	context.strokeText("What's new", margin, Y/1.8);

	context.strokeStyle = "white";
	context.font = "15px courier";
	context.lineWidth = 0.75;
	context.strokeText("➡️  move right", margin, Y / 5 + 2*line_height);
	context.strokeText("⬅️  move left", margin, Y / 5 + 3*line_height);
	context.strokeText("⬆️  move up", margin, Y / 5 + 4*line_height);
	context.strokeText("⬇️  move down", margin, Y / 5 + 5*line_height);

	context.strokeText("[space]  shoot", second_col, Y/5 + 2*line_height);
	//context.strokeStyle = "grey";
	//context.strokeText("[Q]      laser beam", second_col, Y / 5 + 3*line_height);
	context.strokeText("[shift]  speed up", second_col, Y / 5 + 4*line_height);

	context.strokeStyle = "white";
	context.strokeText("Catch the ❤️ to get 1 bonus life", margin, Y / 1.8 + 2*line_height);
	context.strokeText("Catch the ⭐ to activate your laser beam", margin, Y / 1.8 + 3*line_height);
	context.strokeText("There are different types of aliens", margin, Y / 1.8 + 4*line_height);
	context.strokeText("A Boss appears once you shot many of them", margin, Y / 1.8 + 5*line_height);
	context.strokeText("You can change the volume in the SETTINGS menu", margin, Y / 1.8 + 6*line_height);

	aff_fleches(1)
}

function aff_page_2(margin, second_col, line_height) {
	context.clearRect(0, 0, X, Y);

	context.strokeStyle = "purple";
	context.font = "25px courier";
	context.strokeText("A l'attention de M. Jugé :", margin, Y / 5);

	context.strokeStyle = "white";
	context.font = "15px courier";

	const note = [
	"Nous avons choisi d'implémenter certaines règles différemment", 
	"de ce que l'énoncé demandait.",
	"- La vitesse et la direction des balles ne dépendent pas de", 
	"  celle du vaisseau.",
    "  En effet, Le vaisseau n'a pas de vitesse relativement", 
    "  à la fenêtre si on ne touche pas aux commandes", 
    "  (pas d'inertie).",
	"- Les balles ne sont pas dangereuses pour le vaisseau.",
	"- Les collisions sont gérées en utilisant des cercles centrés",
    "  sur les objets plutôt que des carrés.",
	]
	
	for (let i=0; i < note.length; i++) {
		context.strokeText(note[i], margin, Y / 4 + i * line_height);
	}

	aff_fleches(2);
}

function tourne_page(margin, second_col, line_height) {
	window.addEventListener('keydown', 
		function(event) {
			let touche = event.code;
			if (touche == "ArrowRight" && in_help) {
				aff_page_2(margin, second_col, line_height);
				aff_titre();
			}

			else if (touche == "ArrowLeft" && in_help) {
				aff_page_1(margin, second_col, line_height);
				aff_titre();		
			}
		})
	window.removeEventListener("keydown", press_key , false);

}