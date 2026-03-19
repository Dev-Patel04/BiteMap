# Unit Testing Walkthrough

## Changes Made
- Created two distinct service classes, `AuthService` and `RestaurantService`, to satisfy the requirement of unit testing two classes.
- Extracted existing procedural logic for authentication and restaurant querying into these classes.
- Used CommonJS module syntax (`module.exports` and `require()`) to simplify execution with Jest without needing a complex Babel setup.
- Wrote full unit test suites for both classes using Jest's mocking capabilities.

## What Was Tested
- **AuthService**: Tested the `signUp`, `login`, `logout`, and `checkSession` methods by injecting a mocked Supabase client.
- **RestaurantService**: Tested the `getRestaurantById`, `getReviews`, `searchRestaurants`, and `submitReview` methods by mocking the Supabase query builder chain.

## Validation Results
All 8 method unit tests execute successfully when running `npx jest` in the `BiteMap` directory. The test suites fully validate that the correct mocked database and auth API methods are called with the proper arguments.
