// Shared learning system for all math games
// Uses spaced repetition: concepts mastered are shown less, struggles shown more

class LearningSystem {
    constructor(gameId) {
        this.gameId = gameId;
        this.data = this.loadData();
    }

    loadData() {
        const saved = localStorage.getItem(`learning_${this.gameId}`);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            concepts: {}, // tracks each concept's performance
            sessions: [],
            currentLevel: 1,
            unlockedLevels: [1]
        };
    }

    saveData() {
        localStorage.setItem(`learning_${this.gameId}`, JSON.stringify(this.data));
    }

    // Track concept performance (concept could be "count-up", "number-5", "pair-3-7", etc.)
    recordAttempt(conceptId, correct) {
        if (!this.data.concepts[conceptId]) {
            this.data.concepts[conceptId] = {
                attempts: 0,
                correct: 0,
                lastSeen: Date.now(),
                weight: 1.0 // higher = show more often
            };
        }

        const concept = this.data.concepts[conceptId];
        concept.attempts++;
        if (correct) {
            concept.correct++;
            // Reduce weight when correct (show less often)
            concept.weight = Math.max(0.1, concept.weight * 0.8);
        } else {
            // Increase weight when wrong (show more often)
            concept.weight = Math.min(5.0, concept.weight * 1.5);
        }
        concept.lastSeen = Date.now();

        this.saveData();
    }

    // Get concept to practice (weighted random selection)
    getNextConcept(availableConcepts) {
        // Add time-based weight (concepts not seen recently get higher weight)
        const now = Date.now();
        const weights = availableConcepts.map(id => {
            const concept = this.data.concepts[id];
            if (!concept) return 1.0;

            const timeSinceLastSeen = now - concept.lastSeen;
            const timeWeight = Math.min(2.0, timeSinceLastSeen / (1000 * 60 * 5)); // 5 min = 2x weight

            return concept.weight * (1 + timeWeight);
        });

        // Weighted random selection
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < availableConcepts.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return availableConcepts[i];
            }
        }

        return availableConcepts[availableConcepts.length - 1];
    }

    // Check if level should be unlocked
    checkLevelProgress() {
        const conceptsInLevel = Object.keys(this.data.concepts).filter(id => {
            const concept = this.data.concepts[id];
            return concept.attempts > 0;
        });

        if (conceptsInLevel.length === 0) return false;

        // Unlock next level if 80% accuracy on at least 10 attempts
        const totalAttempts = conceptsInLevel.reduce((sum, id) => sum + this.data.concepts[id].attempts, 0);
        const totalCorrect = conceptsInLevel.reduce((sum, id) => sum + this.data.concepts[id].correct, 0);

        if (totalAttempts >= 10 && totalCorrect / totalAttempts >= 0.8) {
            const nextLevel = this.data.currentLevel + 1;
            if (!this.data.unlockedLevels.includes(nextLevel)) {
                this.data.unlockedLevels.push(nextLevel);
                this.saveData();
                return nextLevel;
            }
        }

        return false;
    }

    getCurrentLevel() {
        return this.data.currentLevel;
    }

    setCurrentLevel(level) {
        if (this.data.unlockedLevels.includes(level)) {
            this.data.currentLevel = level;
            this.saveData();
            return true;
        }
        return false;
    }

    getUnlockedLevels() {
        return this.data.unlockedLevels;
    }

    // Get statistics
    getStats() {
        const concepts = Object.values(this.data.concepts);
        const totalAttempts = concepts.reduce((sum, c) => sum + c.attempts, 0);
        const totalCorrect = concepts.reduce((sum, c) => sum + c.correct, 0);
        const successRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

        return {
            totalAttempts,
            totalCorrect,
            successRate,
            conceptsMastered: concepts.filter(c => c.attempts >= 5 && c.correct / c.attempts >= 0.9).length,
            currentLevel: this.data.currentLevel,
            unlockedLevels: this.data.unlockedLevels
        };
    }

    // Reset all data
    reset() {
        localStorage.removeItem(`learning_${this.gameId}`);
        this.data = {
            concepts: {},
            sessions: [],
            currentLevel: 1,
            unlockedLevels: [1]
        };
        this.saveData();
    }
}
