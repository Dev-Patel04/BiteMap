import { describe, test } from 'node:test';
import assert from 'node:assert';

// Function to Implement (TDD approach - fails first)
function calculateBadges(visitedRestaurants) {
    let badges = [];

    // TODO: Implement the logic to pass all the tests below!
    // Rule 1: 3 or more "Sushi" visits earns "Sushi Scout"
    // Rule 2: 3 or more "Pub/Bar Food" visits earns "Burger Boss"
    // Rule 3: 10 or more total visits earns "Super Eater"

    return badges;
}

// Test Suite for User Badges
describe('Badge Calculation Feature', () => {

    test('1. Should earn "Sushi Scout" after visiting 3 Sushi restaurants', () => {
        const visits = [
            { name: "Tokyo Diner", cuisine: "Sushi" },
            { name: "Ocean Bites", cuisine: "Sushi" },
            { name: "Zen Sushi", cuisine: "Sushi" }
        ];

        const badges = calculateBadges(visits);
        assert.ok(badges.includes("Sushi Scout"), 'Expected "Sushi Scout" badge');
    });

    test('2. Should NOT earn "Sushi Scout" if under 3 Sushi visits', () => {
        const visits = [
            { name: "Tokyo Diner", cuisine: "Sushi" },
            { name: "Ocean Bites", cuisine: "Sushi" }
        ];

        const badges = calculateBadges(visits);
        assert.strictEqual(badges.includes("Sushi Scout"), false, 'Should not get badge for only 2 visits');
    });

    test('3. Should earn "Burger Boss" after visiting 3 Pub/Bar Food restaurants', () => {
        const visits = [
            { name: "Burger Joint", cuisine: "Pub/Bar Food" },
            { name: "The Local", cuisine: "Pub/Bar Food" },
            { name: "Taphouse", cuisine: "Pub/Bar Food" }
        ];

        const badges = calculateBadges(visits);
        assert.ok(badges.includes("Burger Boss"), 'Expected "Burger Boss" badge');
    });

    test('4. Should earn "Super Eater" after visiting 10 restaurants total', () => {
        // Create an array of 10 generic restaurant visits
        const visits = Array.from({ length: 10 }, (_, i) => ({ name: `Place ${i}`, cuisine: "Any" }));

        const badges = calculateBadges(visits);
        assert.ok(badges.includes("Super Eater"), 'Expected "Super Eater" badge');
    });

    test('5. Should handle empty visits array without crashing', () => {
        const badges = calculateBadges([]);
        assert.strictEqual(badges.length, 0, 'No badges should be awarded for 0 visits');
    });

});
