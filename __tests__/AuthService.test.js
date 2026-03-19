const { AuthService } = require('../js/services/AuthService');

describe('AuthService', () => {
  let authService;
  let mockSupabase;

  beforeEach(() => {
    // Create a mock object for Supabase
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn()
      }
    };
    
    // Inject the mock object into the class instance
    authService = new AuthService(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('signUp should call supabase.auth.signUp with correct credentials', async () => {
    const mockResponse = { data: { user: { id: '123' } }, error: null };
    mockSupabase.auth.signUp.mockResolvedValue(mockResponse);

    const email = 'test@example.com';
    const password = 'password123';

    const result = await authService.signUp(email, password);

    expect(mockSupabase.auth.signUp).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email,
      password
    });
    expect(result).toEqual(mockResponse);
  });

  test('login should call supabase.auth.signInWithPassword with correct credentials', async () => {
    const mockResponse = { data: { session: { access_token: 'abc' } }, error: null };
    mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse);

    const email = 'test@example.com';
    const password = 'password123';

    const result = await authService.login(email, password);

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email,
      password
    });
    expect(result).toEqual(mockResponse);
  });

  test('logout should call supabase.auth.signOut', async () => {
    const mockResponse = { error: null };
    mockSupabase.auth.signOut.mockResolvedValue(mockResponse);

    const result = await authService.logout();

    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  test('checkSession should call supabase.auth.getSession', async () => {
    const mockResponse = { data: { session: null }, error: null };
    mockSupabase.auth.getSession.mockResolvedValue(mockResponse);

    const result = await authService.checkSession();

    expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });
});
