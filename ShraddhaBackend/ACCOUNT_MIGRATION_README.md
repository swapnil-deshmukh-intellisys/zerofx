# Account Auto-Creation Feature

## Overview
This feature automatically creates an account for the selected account type when a new user signs up, and ensures existing users have their selected account type available.

## What's Changed

### 1. Signup Process (`auth.controller.js`)
- **New users**: When a user signs up, the system now automatically creates an account for the selected account type with:
  - Status: Live
  - Balance: $0.00
  - Leverage: 1:500
  - Initial Deposit: $0

### 2. Account Retrieval (`account.controller.js`)
- **Existing users**: When a user logs in and views their accounts, if they don't have any accounts, the system automatically creates an account for their selected account type
- This ensures backward compatibility with existing users

### 3. AdminData Initialization
- AdminData is automatically initialized for the selected account type with zero balance
- This ensures the admin panel shows correct data for the account type

## Migration for Existing Users

### Option 1: Automatic (Recommended)
The system will automatically create accounts for existing users when they:
1. Log in and navigate to the accounts page
2. The system detects they have no accounts and creates an account for their selected account type

### Option 2: Manual Migration Script
If you want to create accounts for all existing users at once, run:

```bash
cd ShraddhaBackend
npm run migrate-users
```

This script will:
- Find all users in the database
- Check if they have accounts
- Create an account for their selected account type if they don't have any
- Initialize AdminData for the selected account type

## How It Works

### For New Users:
1. User signs up and selects an account type
2. System creates user record
3. System automatically creates an account for the selected account type
4. Account starts with $0.00 balance
5. User can immediately see their selected account type in their accounts section

### For Existing Users:
1. User logs in
2. When they view accounts, system checks if they have any accounts
3. If no accounts exist, system creates an account for their selected account type automatically
4. User can immediately see their selected account type in their accounts section

### Deposit Process:
1. User makes a deposit request for any account type
2. Admin approves the deposit
3. Balance is updated for that specific account type
4. AdminData is also updated to reflect the new balance

## Benefits

1. **Seamless User Experience**: Users immediately see their selected account type available
2. **No Manual Account Creation**: Users don't need to manually create their selected account type
3. **Consistent Data**: All users have their selected account type ready
4. **Backward Compatible**: Existing users are automatically migrated
5. **Admin Panel Ready**: AdminData is properly initialized for the selected account type

## Testing

To test the feature:

1. **New User Signup**:
   - Create a new user account and select an account type (e.g., "Platinum")
   - Check that only the selected account type appears in the accounts section
   - Verify the balance starts at $0.00

2. **Existing User Login**:
   - Log in with an existing user
   - Navigate to accounts section
   - Verify their selected account type appears (if they didn't have accounts before)

3. **Deposit Process**:
   - Make a deposit request for any account type
   - Approve the deposit as admin
   - Verify the balance updates correctly

## Files Modified

- `controllers/auth.controller.js` - Added auto-account creation during signup
- `controllers/account.controller.js` - Added auto-account creation for existing users
- `scripts/migrateExistingUsers.js` - Migration script for existing users
- `package.json` - Added migration script command

## Notes

- Accounts are created with "Live" status
- All accounts start with $0.00 balance
- The system is designed to be fault-tolerant - if account creation fails, user creation still succeeds
- AdminData is automatically initialized for the selected account type
- The migration script is safe to run multiple times (it won't create duplicate accounts)
- Users can still manually create additional account types if needed through the existing account creation flow
