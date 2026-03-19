const { RestaurantService } = require('../js/services/RestaurantService');

describe('RestaurantService', () => {
  let restaurantService;
  let mockSupabase;
  let mockQueryBuilder;

  beforeEach(() => {
    // We create a mock query builder to simulate the Supabase chaining mechanism
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      then: jest.fn() // allow manual resolution of the chain
    };

    mockSupabase = {
      from: jest.fn().mockReturnValue(mockQueryBuilder)
    };

    restaurantService = new RestaurantService(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getRestaurantById should build query and return correct data', async () => {
    const mockResponse = { data: { id: '1', name: 'Pizza Place' }, error: null };
    
    // Resolve the promise chain manually since the class awaits it
    mockQueryBuilder.single = jest.fn().mockResolvedValue(mockResponse);

    const result = await restaurantService.getRestaurantById('1');

    expect(mockSupabase.from).toHaveBeenCalledWith('restaurants');
    expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', '1');
    expect(mockQueryBuilder.single).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  test('getReviews should fetch ordered reviews from the correct table', async () => {
    const mockResponse = { data: [{ id: '100', comment: 'Great!' }], error: null };
    mockQueryBuilder.order = jest.fn().mockResolvedValue(mockResponse);

    const result = await restaurantService.getReviews('1');

    expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, profiles(username)');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('restaurant_id', '1');
    expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual(mockResponse);
  });

  test('searchRestaurants should call the .or method with search queries', async () => {
    const mockResponse = { data: [{ id: '1', name: 'Burger Joint' }], error: null };
    mockQueryBuilder.or = jest.fn().mockResolvedValue(mockResponse);

    const result = await restaurantService.searchRestaurants('burger');

    expect(mockSupabase.from).toHaveBeenCalledWith('restaurants');
    expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
    expect(mockQueryBuilder.or).toHaveBeenCalledWith('name.ilike.%burger%,cuisine_tag.ilike.%burger%');
    expect(result).toEqual(mockResponse);
  });

  test('submitReview should insert a new review securely', async () => {
    const mockResponse = { data: null, error: null };
    mockQueryBuilder.insert = jest.fn().mockResolvedValue(mockResponse);

    const result = await restaurantService.submitReview('user123', 'rest456', 5, 'Loved it!');

    expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
      user_id: 'user123',
      restaurant_id: 'rest456',
      star_rating: 5,
      comment: 'Loved it!'
    });
    expect(result).toEqual(mockResponse);
  });
});
