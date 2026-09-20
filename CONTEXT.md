# tobuylist

A shopping list a person owns, fills with items from stores, and can open to others via a share link.

## Language

**List**:
A named collection of items belonging to one owner.
_Avoid_: Wishlist, cart, board

**Item**:
A product a person wants to buy: name, store, link, price in cents, quantity, and image.
_Avoid_: Product (except as the result of Autofill), row, entry

**Store**:
The retailer an item comes from, usually derived from the item link.
_Avoid_: Shop, loja, merchant

**Cents**:
The only stored form of an item price: an integer number of Brazilian centavos.
_Avoid_: Reais, float price, formatted price

**Autofill**:
Filling an item draft from a product URL: name, store, price, and image.
_Avoid_: Scrape, import, parse

**Share link**:
The visitor URL for a list (`?share=true`), enabled when the owner turns sharing on.
_Avoid_: Shared list, public link

**Public**:
Whether visitors who later save the list may change its items.
_Avoid_: Shared, editable, open

**Saved list**:
A bookmark of someone else's list, kept by the current user.
_Avoid_: Shared list, copy, subscription

**List owner**:
The user who created the list.
_Avoid_: Author, admin

**Visitor**:
Someone opening a share link who does not own the list.
_Avoid_: Guest, shared user

**List relationship**:
Who the current user is to a list: owner, visitor, or saved. Taken from ownership and bookmark, not from the URL.
_Avoid_: Role, permission, access mode

**List total**:
The sum, in cents, of every active item on a list (price × quantity).
_Avoid_: Subtotal, cart total, value
