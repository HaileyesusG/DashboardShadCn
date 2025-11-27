# Debugging Invitation System

## Steps to Check

### 1. Check Database
Open Prisma Studio at http://localhost:5555
- Click on "Invitation" model
- Check if invitation records exist
- Verify the email matches exactly

### 2. Check Browser Console
When invited user logs in:
- Press F12
- Go to Network tab
- Look for `/api/invitations` request
- Check the response

### 3. Common Issues

**Issue 1: Email Mismatch**
- Invitation email must EXACTLY match signup email
- Check for typos, spaces, or case differences

**Issue 2: Invitation Expired**
- Invitations expire after 7 days
- Check `expiresAt` field in database

**Issue 3: API Not Being Called**
- Check if redirect logic is working
- Look for errors in browser console

### 4. Manual Test

Try accessing directly:
- Go to http://localhost:3001/invitations
- Do you see the invitations page?
- Are there any invitations listed?

## What to Report

Please tell me:
1. Do you see invitation records in Prisma Studio?
2. What email is in the invitation record?
3. What email did the invited user sign up with?
4. Any errors in browser console?
