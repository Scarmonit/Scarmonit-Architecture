// 3D Card Hover Effect
document.addEventListener('mousemove', e => {
    document.querySelectorAll('.card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Chat Widget Logic
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

function toggleChat() {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
        chatInput.focus();
    }
}

chatToggle.addEventListener('click', toggleChat);
chatClose.addEventListener('click', toggleChat);

function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.remove();
}

async function handleSend() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = '';
    showTyping();

    try {
        const response = await fetch('https://agent.scarmonit.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 8d5e0667caed6312a559d56bfb23db4895977907974ceda28d20fbd3fb9812d5'
            },
            body: JSON.stringify({
                model: "local-model",
                messages: [
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        removeTyping();

        if (data.choices && data.choices.length > 0) {
            addMessage(data.choices[0].message.content);
        } else if (data.error) {
            addMessage("Error: " + (data.error.message || "Unknown error"));
        } else {
            addMessage("Received empty response from agent.");
        }

    } catch (error) {
        removeTyping();
        addMessage("Connection error. Is the agent online?");
        console.error(error);
    }
}

chatSend.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

console.log('🚀 System Online: Scarmonit Intelligence Layer Active');
