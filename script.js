document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DEL JUEGO ---
    let gameState = {
        peace: 50,
        tension: 10,
        budget: 1000,
        influence: 50,
        year: 2024,
        tickCounter: 0,
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
    const yearValue = document.getElementById('year-value');

    // --- DATOS DE PROYECTOS Y EVENTOS (con iconos) ---
    const projects = [
        { id: 'food_aid', name: 'Ayuda Alimentaria', cost: 100, influence: 5, peace: 2, tension: -1, icon: 'fa-utensils' },
        { id: 'schools', name: 'Construir Escuelas', cost: 250, influence: 10, peace: 3, tension: 0, icon: 'fa-school' },
        { id: 'diplomacy', name: 'Mediar Conflicto', cost: 50, influence: 20, peace: 4, tension: -3, icon: 'fa-hands-holding-circle' },
        { id: 'green_energy', name: 'Energía Verde Global', cost: 500, influence: 15, peace: 2, tension: -1, icon: 'fa-leaf' },
    ];

    const randomEvents = [
        // (Los eventos permanecen igual, no es necesario copiarlos de nuevo si no quieres)
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

    function updateUI() {
        yearValue.textContent = gameState.year;
        peaceValue.textContent = `${Math.round(gameState.peace)}%`;
        peaceBar.style.width = `${gameState.peace}%`;
        tensionValue.textContent = `${Math.round(gameState.tension)}%`;
        tensionBar.style.width = `${gameState.tension}%`;
        
        // Añadir efecto de pulso si la tensión es alta
        if (gameState.tension > 75) {
            tensionBar.classList.add('pulse-warning');
        } else {
            tensionBar.classList.remove('pulse-warning');
        }

        budgetValue.textContent = `${gameState.budget}`;
        influenceValue.textContent = `${gameState.influence}`;

        // Renderizar TARJETAS de proyectos
        projectsList.innerHTML = '';
        projects.forEach(p => {
            const canAfford = gameState.budget >= p.cost && gameState.influence >= p.influence;
            const card = document.createElement('div');
            card.className = `project-card ${!canAfford ? 'disabled' : ''}`;
            card.dataset.id = p.id;
            
            card.innerHTML = `
                <div class="project-card-header">
                    <i class="fas ${p.icon} project-icon"></i>
                    <span class="project-title">${p.name}</span>
                </div>
                <div class="project-details">
                    <span class="project-cost"><i class="fas fa-coins"></i> Costo: ${p.cost}$ / ${p.influence}∆</span>
                    <span class="project-effect"><i class="fas fa-arrow-up"></i> Paz: +${p.peace}%</span>
                    <span class="project-tension"><i class="fas fa-arrow-down"></i> Tensión: ${p.tension}%</span>
                </div>
                ${!canAfford ? '<div class="disabled-overlay"><i class="fas fa-lock"></i></div>' : ''}
            `;

            if (canAfford) {
                card.addEventListener('click', handleProjectClick);
            }
            projectsList.appendChild(card);
        });
    }

    function handleProjectClick(event) {
        const projectId = event.currentTarget.dataset.id;
        const project = projects.find(p => p.id === projectId);

        if (project) { // No es necesario volver a comprobar si puede pagar, porque el listener solo se añade si puede
            gameState.budget -= project.cost;
            gameState.influence -= project.influence;
            gameState.peace += project.peace;
            gameState.tension += project.tension;
            addToLog(`Proyecto "${project.name}" completado.`);
            clampAndUpdate();
        }
    }
    
    function gameTick() {
        gameState.tickCounter++;
        // Cada 4 ticks (12 segundos), pasa un año
        if (gameState.tickCounter % 4 === 0) {
            gameState.year++;
        }
        
        gameState.budget += 50;
        gameState.influence += 10;
        gameState.tension += 0.5;

        if (Math.random() < 0.25) {
            triggerRandomEvent();
        } else {
            clampAndUpdate();
        }
    }

    function triggerRandomEvent() {
        // ... (Esta función es idéntica a la anterior, no necesita cambios)
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
                clampAndUpdate();
            };
            choicesContainer.appendChild(button);
        });

        modal.classList.remove('hidden');
    }
    
    function clampStats() {
        gameState.peace = Math.max(0, Math.min(100, gameState.peace));
        gameState.tension = Math.max(0, Math.min(100, gameState.tension));
    }

    function clampAndUpdate() {
        clampStats();
        updateUI();
        checkEndConditions();
    }
    
    function addToLog(message) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>[Año ${gameState.year}]</strong> ${message}`;
        logList.prepend(li);
        if(logList.children.length > 50) {
            logList.removeChild(logList.lastChild);
        }
    }

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
    clampAndUpdate(); // Dibuja la UI inicial y comprueba estado
    const gameInterval = setInterval(gameTick, gameState.tickSpeed);
});