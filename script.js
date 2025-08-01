document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DEL JUEGO ---
    let gameState = {
        peace: 50,
        tension: 10,
        budget: 1000,
        influence: 50,
        year: 2024,
        tickSpeed: 3000 // Un "tick" o turno ocurre cada 3 segundos
    };

    // --- ELEMENTOS DEL DOM ---
    const peaceBar = document.getElementById('peace-bar');
    const peaceValue = document.getElementById('peace-value');
    const tensionBar = document.getElementById('tension-bar');
    const tensionValue = document.getElementById('tension-value');
    const budgetValue = document.getElementById('budget-value');
    const influenceValue = document.getElementById('influence-value');
    const projectsList = document.getElementById('projects-list');
    const logList = document.getElementById('log-list');

    // --- DATOS DE PROYECTOS Y EVENTOS ---
    const projects = [
        { id: 'food_aid', name: 'Enviar Ayuda Alimentaria', cost: 100, influence: 5, peace: 2, tension: -1 },
        { id: 'schools', name: 'Construir Escuelas', cost: 250, influence: 10, peace: 3, tension: 0 },
        { id: 'diplomacy', name: 'Mediar en Conflicto Regional', cost: 50, influence: 20, peace: 4, tension: -3 },
        { id: 'green_energy', name: 'Invertir en Energía Verde', cost: 500, influence: 15, peace: 2, tension: -1 },
    ];

    const randomEvents = [
        {
            title: "Desastre Natural",
            description: "Un terremoto ha devastado una región pobre. El mundo mira hacia ti.",
            choices: [
                { text: "Enviar ayuda masiva (-300$)", effect: () => { gameState.budget -= 300; gameState.peace += 5; gameState.tension -= 2; addToLog("Enviaste ayuda masiva, ganando gratitud mundial."); } },
                { text: "Ofrecer apoyo diplomático (-20∆)", effect: () => { gameState.influence -= 20; gameState.peace += 1; addToLog("Ofreciste apoyo, pero la gente necesitaba más."); } }
            ]
        },
        {
            title: "Tensiones Fronterizas",
            description: "Dos naciones están al borde de la guerra por una disputa territorial.",
            choices: [
                { text: "Mediar personalmente (-50∆)", effect: () => { gameState.influence -= 50; gameState.tension -= 10; gameState.peace += 3; addToLog("Tu mediación evitó una guerra."); } },
                { text: "Ignorar la situación", effect: () => { gameState.tension += 15; addToLog("La inacción ha llevado la situación al límite."); } }
            ]
        }
    ];

    // --- FUNCIONES DEL JUEGO ---

    // Actualiza toda la interfaz de usuario con los datos del gameState
    function updateUI() {
        // Actualizar barras y valores
        peaceValue.textContent = `${Math.round(gameState.peace)}%`;
        peaceBar.style.width = `${gameState.peace}%`;
        tensionValue.textContent = `${Math.round(gameState.tension)}%`;
        tensionBar.style.width = `${gameState.tension}%`;

        budgetValue.textContent = `${gameState.budget}`;
        influenceValue.textContent = `${gameState.influence}`;

        // Renderizar botones de proyectos
        projectsList.innerHTML = '';
        projects.forEach(p => {
            const canAfford = gameState.budget >= p.cost && gameState.influence >= p.influence;
            projectsList.innerHTML += `
                <button class="project-button" data-id="${p.id}" ${!canAfford ? 'disabled' : ''}>
                    <span class="project-title">${p.name}</span><br>
                    <small>
                        Costo: <span class="project-cost">${p.cost}$</span>, <span class="project-cost">${p.influence}∆</span> | 
                        Efecto: <span class="project-effect">+${p.peace} Paz</span>, <span class="project-tension">${p.tension} Tensión</span>
                    </small>
                </button>
            `;
        });
        
        // Añadir listeners a los nuevos botones
        document.querySelectorAll('.project-button').forEach(button => {
            button.addEventListener('click', handleProjectClick);
        });
    }

    // Maneja el click en un proyecto
    function handleProjectClick(event) {
        const projectId = event.currentTarget.dataset.id;
        const project = projects.find(p => p.id === projectId);

        if (project && gameState.budget >= project.cost && gameState.influence >= project.influence) {
            // Aplicar costos y efectos
            gameState.budget -= project.cost;
            gameState.influence -= project.influence;
            gameState.peace += project.peace;
            gameState.tension += project.tension;

            // Asegurarse de que los valores no se salgan de los límites
            clampStats();
            addToLog(`Proyecto "${project.name}" completado.`);
            updateUI();
            checkEndConditions();
        }
    }
    
    // El "motor" del juego que corre cada X segundos
    function gameTick() {
        // Generación pasiva de recursos
        gameState.budget += 50;
        gameState.influence += 10;
        
        // La tensión tiende a aumentar lentamente por sí sola
        gameState.tension += 0.5;

        // Probabilidad de que ocurra un evento aleatorio
        if (Math.random() < 0.25) { // 25% de probabilidad por tick
            triggerRandomEvent();
        } else {
             // Actualizar UI solo si no hay evento
            clampStats();
            updateUI();
            checkEndConditions();
        }
    }

    function triggerRandomEvent() {
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        const modal = document.getElementById('event-modal');
        document.getElementById('event-title').textContent = event.title;
        document.getElementById('event-description').textContent = event.description;
        
        const choicesContainer = document.getElementById('event-choices');
        choicesContainer.innerHTML = '';
        event.choices.forEach(choice => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.onclick = () => {
                choice.effect();
                modal.classList.add('hidden');
                clampStats();
                updateUI();
                checkEndConditions();
            };
            choicesContainer.appendChild(button);
        });

        modal.classList.remove('hidden');
    }
    
    // Mantiene los valores entre 0 y 100
    function clampStats() {
        gameState.peace = Math.max(0, Math.min(100, gameState.peace));
        gameState.tension = Math.max(0, Math.min(100, gameState.tension));
    }
    
    // Añade un mensaje al panel de registro
    function addToLog(message) {
        const li = document.createElement('li');
        li.textContent = `[Año ${gameState.year}] ${message}`;
        logList.prepend(li);
        if(logList.children.length > 50) {
            logList.removeChild(logList.lastChild);
        }
    }

    // Comprueba si el juego ha terminado
    function checkEndConditions() {
        if (gameState.peace >= 100) {
            alert("¡FELICIDADES! Has alcanzado la paz global. El mundo te agradece tu sabiduría y liderazgo.");
            clearInterval(gameInterval);
        }
        if (gameState.tension >= 100) {
            alert("¡DERROTA! La tensión global ha llegado a un punto sin retorno. El mundo se sumerge en el conflicto.");
            clearInterval(gameInterval);
        }
    }

    // --- INICIO DEL JUEGO ---
    updateUI(); // Dibuja la UI inicial
    const gameInterval = setInterval(gameTick, gameState.tickSpeed); // Inicia el bucle del juego
});