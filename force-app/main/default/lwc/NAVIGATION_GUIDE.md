# Lightning Web Component Navigation Guide

## Overview
This guide explains how to implement page navigation in your LWC components using the container-based navigation pattern.

## Architecture

```
vendorNavigationComponent (Parent Container)
├── Manages currentPage state
├── Conditionally renders child components based on currentPage
└── Listens for 'navigate' custom events from children

Child Components (vendorLogin, vendorRegistration, vendorDashboard)
└── Dispatch 'navigate' custom events with page names
```

## How It Works

### 1. Parent Navigation Component

**File:** `vendorNavigationComponent.js`

```javascript
export default class VendorNavigationComponent extends LightningElement {
    currentPage = 'login'; // default page

    get isLogin() {
        return this.currentPage === 'login';
    }

    get isRegister() {
        return this.currentPage === 'register';
    }

    get isDashboard() {
        return this.currentPage === 'dashboard';
    }

    handleNavigation(event) {
        this.currentPage = event.detail;
    }
}
```

**Key Points:**
- `currentPage` tracks which page to display
- Getter methods (`isLogin`, `isRegister`, `isDashboard`) determine which component to render
- `handleNavigation()` updates `currentPage` when child components dispatch events

**Template:** `vendorNavigationComponent.html`

```html
<template>
    <template if:true={isLogin}>
        <c-vendor-login onnavigate={handleNavigation}></c-vendor-login>
    </template>

    <template if:true={isRegister}>
        <c-vendor-registration onnavigate={handleNavigation}></c-vendor-registration>
    </template>

    <template if:true={isDashboard}>
        <c-vendor-dashboard onnavigate={handleNavigation}></c-vendor-dashboard>
    </template>
</template>
```

### 2. Child Components - Dispatching Navigation Events

All child components dispatch a standardized `navigate` custom event:

```javascript
this.dispatchEvent(new CustomEvent('navigate', {
    detail: 'pageName'  // 'login', 'register', or 'dashboard'
}));
```

### 3. Implementation Examples

#### Example 1: Navigate from Login to Registration
**File:** `vendorLogin.js`

```javascript
handleNavigateToRegister() {
    this.dispatchEvent(new CustomEvent('navigate', {
        detail: 'register'
    }));
}
```

**Usage in HTML:**
```html
<lightning-button label="Register" onclick={handleNavigateToRegister}></lightning-button>
```

#### Example 2: Navigate to Dashboard After Successful Login
**File:** `vendorLogin.js`

```javascript
handleRegister() {
    vendorLogin({vendorLoginDetails: vendorLoginDetails}).then(result => {
        if(result === 'success') {
            this.showToast('Success', 'Login successful!', 'success');
            // Navigate to dashboard
            this.dispatchEvent(new CustomEvent('navigate', {
                detail: 'dashboard'
            }));
        }
    });
}
```

#### Example 3: Navigate Back to Login After Registration
**File:** `vendorRegistration.js`

```javascript
vendorRegistration({vendorRec: vendorDetails, vendorCon: vendorContactDetails})
    .then((result) => {
        this.showToast1('Success', result, 'success');
        // Navigate to login after successful registration
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: 'login'
        }));
    });
```

#### Example 4: Logout from Dashboard
**File:** `vendorDashboard.js`

```javascript
handleLogout() {
    this.dispatchEvent(new CustomEvent('navigate', {
        detail: 'login'
    }));
}
```

## Navigation Flow

```
Login Page (vendorLogin)
    ├──[Click "Register"]──> Registration Page (vendorRegistration)
    │                             └──[Click "Back to Login"]──> Login Page
    │                             └──[Successful Registration]──> Login Page
    │
    └──[Successful Login]──> Dashboard (vendorDashboard)
                                  └──[Click "Logout"]──> Login Page
```

## Best Practices

### ✅ DO:
1. **Use standardized event names**: Always use `'navigate'` as the event name
2. **Use consistent page identifiers**: Use `'login'`, `'register'`, `'dashboard'` as detail values
3. **Dispatch after async operations complete**: Wait for server responses before navigating
4. **Handle navigation in dedicated methods**: Create clear handler methods like `handleNavigateToRegister()`

### ❌ DON'T:
1. **Don't use different event names** for the same purpose
2. **Don't manage show/hide state in child components** - let the parent handle all navigation
3. **Don't navigate without user feedback** - show success/error messages before navigating
4. **Don't hardcode navigation logic** - use the event-based pattern

## Adding New Pages

To add a new page to the navigation system:

1. **Update Parent Component JS** (`vendorNavigationComponent.js`):
   ```javascript
   get isNewPage() {
       return this.currentPage === 'newpage';
   }
   ```

2. **Update Parent Component HTML** (`vendorNavigationComponent.html`):
   ```html
   <template if:true={isNewPage}>
       <c-new-page-component onnavigate={handleNavigation}></c-new-page-component>
   </template>
   ```

3. **Implement Navigation in Child Component**:
   ```javascript
   handleNavigateToNewPage() {
       this.dispatchEvent(new CustomEvent('navigate', {
           detail: 'newpage'
       }));
   }
   ```

## Troubleshooting

### Navigation not working?
- Verify the child component dispatches `'navigate'` event (not other names)
- Check the `detail` value matches the page identifier in parent component
- Ensure parent template uses `onnavigate={handleNavigation}`

### Page not rendering?
- Check the getter method name matches the template condition
- Verify `currentPage` is being updated in `handleNavigation()`
- Use browser console to log `currentPage` value

## Summary

This navigation pattern provides:
- ✅ **Single source of truth** for navigation state
- ✅ **Loosely coupled components** that don't know about each other
- ✅ **Easy to extend** with new pages
- ✅ **Predictable behavior** with standardized events
- ✅ **Clean separation of concerns** between navigation and business logic