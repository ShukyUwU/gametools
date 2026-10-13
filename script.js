"use strict";

const $ = (selector) => document.querySelector(selector);

function formatNumber(value, decimals = 3) {
	return new Intl.NumberFormat("es-CR", {
		maximumFractionDigits: decimals
	}).format(value);
}

function showMessage(message) {
	const toast = $("#toast");

	toast.textContent = message;
	toast.classList.add("visible");

	clearTimeout(showMessage.timer);

	showMessage.timer = setTimeout(() => {
		toast.classList.remove("visible");
	}, 3000);
}

// HERRAMIENTA 1: CALCULADORA DE eDPI

function calculateEDPI() {
	const dpi = Number($("#dpi").value);
	const sensitivity = Number($("#sensitivity").value);

	if (
		!Number.isFinite(dpi) ||
		!Number.isFinite(sensitivity) ||
		dpi < 1 ||
		dpi > 100000 ||
		sensitivity <= 0 ||
		sensitivity > 10000
	) {
		showMessage("Introduce un DPI y una sensibilidad válidos.");
		return;
	}

	$("#edpi-result").textContent = formatNumber(dpi * sensitivity);

	$("#result-description").textContent =
		`${$("#game").value}: ${formatNumber(dpi)} DPI × ` +
		`${formatNumber(sensitivity)} de sensibilidad`;
}

$("#sensitivity-form").addEventListener("submit", (event) => {
	event.preventDefault();

	if (!event.currentTarget.reportValidity()) return;

	calculateEDPI();
});

// HERRAMIENTA 2: CALCULADORA DE FPS Y HZ

function calculateFPS() {
	const fps = Number($("#game-fps").value);
	const hz = Number($("#monitor-hz").value);

	if (
		!Number.isFinite(fps) ||
		fps < 1 ||
		fps > 2000 ||
		!Number.isFinite(hz) ||
		hz <= 0
	) {
		showMessage("Introduce una cantidad válida de FPS.");
		return;
	}

	$("#fps-ratio").textContent =
		`${formatNumber((fps / hz) * 100, 1)}%`;

	$("#fps-description").textContent =
		`${formatNumber(fps, 1)} FPS en un monitor de ${hz} Hz`;

	$("#frame-time").textContent =
		`${formatNumber(1000 / fps, 2)} ms`;

	$("#refresh-time").textContent =
		`${formatNumber(1000 / hz, 2)} ms`;

	if (fps < hz) {
		$("#fps-advice").textContent =
			"Tus FPS están por debajo de los Hz del monitor. " +
			"El monitor puede actualizarse más veces por segundo " +
			"que los fotogramas que genera el juego.";
	} else if (fps === hz) {
		$("#fps-advice").textContent =
			"Tus FPS coinciden numéricamente con los Hz del monitor. " +
			"Esto no garantiza una sincronización perfecta.";
	} else {
		$("#fps-advice").textContent =
			"Tus FPS superan los Hz del monitor. Esto puede reducir " +
			"la latencia de entrada, aunque pueden aparecer desgarros " +
			"de imagen sin sincronización.";
	}
}

$("#fps-form").addEventListener("submit", (event) => {
	event.preventDefault();

	if (!event.currentTarget.reportValidity()) return;

	calculateFPS();
});

// HERRAMIENTA 3: ASISTENTE DE AUDIO

const audioRecommendations = {
	quiet: {
		title: "Mejora el volumen de tu voz",
		intro: "Vamos a empezar por la señal de entrada del micrófono.",
		tips: [
			"En Windows, abre Configuración > Sistema > Sonido y selecciona tu micrófono de entrada correcto.",
			"Habla a una distancia aproximada de 10 a 20 cm y comprueba que el micrófono esté orientado hacia tu boca.",
			"Aumenta gradualmente el nivel de entrada del micrófono. Evita subirlo al máximo si comienza a distorsionar.",
			"Si utilizas OBS, añade un filtro Compresor con moderación para controlar las diferencias entre una voz baja y una voz alta.",
			"Haz una grabación de prueba y escucha el resultado antes de transmitir."
		],
		extra: "El refuerzo de micrófono no está disponible en todos los dispositivos. Si aumenta mucho el ruido, vuelve a reducirlo."
	},

	noise: {
		title: "Reduce el ruido de fondo",
		intro: "El objetivo es reducir el ruido sin eliminar partes de tu voz.",
		tips: [
			"Aleja el micrófono de los ventiladores del PC y evita colocarlo directamente frente a una corriente de aire.",
			"Reduce el volumen de entrada si está demasiado alto y acerca el micrófono para captar mejor tu voz.",
			"En OBS, prueba el filtro Supresión de ruido. RNNoise es una opción disponible en versiones compatibles.",
			"En Discord, prueba la cancelación de ruido integrada si está disponible y comprueba que no recorte tu voz.",
			"Desactiva filtros duplicados si la voz suena metálica, entrecortada o artificial."
		],
		extra: "La supresión de ruido puede ayudar con sonidos constantes, pero no elimina perfectamente todos los ruidos."
	},

	echo: {
		title: "Reduce el eco y el sonido del juego",
		intro: "Primero debemos identificar de dónde viene el sonido que vuelve al micrófono.",
		tips: [
			"Usa auriculares en vez de altavoces para reducir la posibilidad de que el sonido vuelva a entrar por el micrófono.",
			"Reduce el volumen de los auriculares si el micrófono está captando su sonido.",
			"En Discord, revisa la cancelación de eco y selecciona correctamente los dispositivos de entrada y salida.",
			"En OBS, evita capturar dos veces la misma fuente de audio.",
			"Si escuchas tu propia voz con retraso, comprueba si está activada la monitorización del micrófono en Windows, OBS o tu software de audio."
		],
		extra: "La solución exacta depende de si el eco proviene de los altavoces, de una monitorización duplicada o de la acústica de la habitación."
	},

	clarity: {
		title: "Consigue una voz más clara",
		intro: "Una buena posición del micrófono y una señal limpia son el mejor punto de partida.",
		tips: [
			"Coloca el micrófono cerca de tu boca, sin hablar directamente contra la cápsula si eso produce golpes de aire.",
			"En OBS, prueba un filtro de puerta de ruido solo si necesitas reducir el sonido ambiente cuando no hablas.",
			"Usa un ecualizador con cambios moderados para reducir sonidos graves innecesarios y ajustar la claridad.",
			"Prueba un compresor suave para mantener un volumen de voz más uniforme.",
			"Graba 20 segundos de conversación normal y escucha si las consonantes se entienden bien."
		],
		extra: "No existe una única configuración ideal para todos los micrófonos y voces. Ajusta los filtros escuchando grabaciones."
	},

	clipping: {
		title: "Evita la saturación del micrófono",
		intro: "Si la señal ya llega distorsionada al programa, los filtros posteriores no siempre podrán repararla.",
		tips: [
			"Reduce el nivel de entrada del micrófono en Windows o en el control de ganancia del dispositivo.",
			"Habla con tu volumen habitual y haz una grabación mientras compruebas los medidores.",
			"En OBS, intenta que la voz normal tenga margen antes de alcanzar la zona roja del medidor.",
			"Si usas un compresor, revisa su umbral y su ganancia de salida para no volver a saturar la señal.",
			"Desactiva temporalmente otros efectos de audio para identificar cuál está causando la distorsión."
		],
		extra: "Si el audio se distorsiona antes de entrar al ordenador, reduce la ganancia física o la sensibilidad de entrada del dispositivo."
	},

	setup: {
		title: "Configura tu micrófono desde cero",
		intro: "Vamos a establecer una base sencilla antes de añadir efectos.",
		tips: [
			"Selecciona tu micrófono correcto en Windows y comprueba que la aplicación tenga permiso para usarlo.",
			"Habla y verifica que el medidor de entrada responda a tu voz.",
			"Coloca el micrófono cerca de tu boca y ajusta el nivel de entrada sin provocar distorsión.",
			"Selecciona el dispositivo correcto dentro de Discord, OBS o tu programa habitual.",
			"Graba una prueba corta. Añade supresión de ruido o compresión solo si realmente lo necesitas."
		],
		extra: "Es mejor comenzar con una señal limpia y pocos filtros que activar muchos efectos sin comprobar su resultado."
	}
};

const applicationTips = {
	discord: "En Discord, entra en Ajustes de usuario > Voz y vídeo. Revisa el dispositivo de entrada y prueba las opciones de procesamiento una por una.",

	obs: "En OBS, abre el mezclador de audio, pulsa el menú de tu micrófono y entra en Filtros. Puedes añadir filtros compatibles y probarlos por separado.",

	steelseries: "En SteelSeries GG / Sonar, selecciona el micrófono correcto y revisa el nivel de entrada, los filtros disponibles y el dispositivo que recibe la señal.",

	windows: "En Windows, entra en Configuración > Sistema > Sonido > Entrada. Selecciona tu micrófono y revisa el nivel y el medidor de prueba.",

	other: "Busca los ajustes de entrada de audio de tu programa. Confirma qué micrófono está seleccionado y realiza una grabación de prueba."
};

const microphoneTips = {
	headset: "Con un headset, acerca el micrófono a la comisura de la boca sin que roce tus labios. Comprueba que el cable y el conector estén bien conectados.",

	usb: "Con un micrófono USB, comprueba que esté seleccionado como dispositivo de entrada y colócalo sobre una superficie estable.",

	boom: "Si usas un brazo, ajusta la posición del micrófono cerca de tu boca. Un soporte adecuado puede ayudar a reducir las vibraciones transmitidas desde el escritorio.",

	laptop: "Con el micrófono integrado del portátil, intenta hablar desde una posición fija y alejar el equipo de fuentes de ruido. Un micrófono externo puede ofrecer más control.",

	other: "Comprueba el manual de tu micrófono para identificar el control de ganancia, el patrón de captación y las funciones que admite."
};

const usageTips = {
	gaming: "Para jugar con amigos, prioriza que tu voz se entienda y que los filtros no corten las primeras sílabas.",

	discord: "Para llamadas, prueba primero el procesamiento de voz integrado y evita activar simultáneamente varias funciones que hagan lo mismo.",

	streaming: "Para streaming, realiza una grabación local en OBS y comprueba el equilibrio entre tu voz, el juego y las alertas antes de emitir.",

	recording: "Para grabaciones, busca un entorno silencioso, mantén una distancia constante al micrófono y guarda una prueba antes de grabar todo el contenido."
};

$("#audio-form").addEventListener("submit", (event) => {
	event.preventDefault();

	const problem = $("#audio-problem").value;
	const app = $("#audio-app").value;
	const mic = $("#mic-type").value;
	const usage = $("#audio-use").value;

	const recommendation = audioRecommendations[problem];

	if (!recommendation) {
		showMessage("No se encontraron recomendaciones.");
		return;
	}

	$("#audio-result-title").textContent = recommendation.title;
	$("#audio-result-intro").textContent = recommendation.intro;

	const tipsList = $("#audio-tips");
	tipsList.replaceChildren();

	const allTips = [
		...recommendation.tips,
		microphoneTips[mic],
		usageTips[usage],
		applicationTips[app]
	];

	allTips.forEach((tip) => {
		const item = document.createElement("li");
		item.textContent = tip;
		tipsList.appendChild(item);
	});

	$("#audio-extra").textContent = recommendation.extra;

	$("#audio-result").hidden = false;

	$("#audio-result").scrollIntoView({
		behavior: "smooth",
		block: "nearest"
	});

	showMessage("Tu guía de audio está lista.");
});

$("#audio-reset").addEventListener("click", () => {
	$("#audio-form").reset();
	$("#audio-result").hidden = true;

	$("#audio-form").scrollIntoView({
		behavior: "smooth",
		block: "center"
	});
});

// AÑO DEL FOOTER

$("#year").textContent = new Date().getFullYear();

// RESULTADOS INICIALES

calculateEDPI();
calculateFPS();
