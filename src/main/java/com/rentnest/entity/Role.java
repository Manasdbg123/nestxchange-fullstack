package com.rentnest.entity;

/**
 * Account roles.
 *
 * <p>Roles describe how someone signed up, not what they may do with a given
 * listing. Anyone can post a property, so permission to edit or manage a
 * listing is decided by ownership checks in the service layer rather than by
 * the role here. {@link #ADMIN} is the only role that grants extra authority,
 * and it is never assignable through the public registration endpoint.
 */
public enum Role {

    /** Someone looking for a place to rent. Default for new sign-ups. */
    TENANT,

    /** Someone whose primary intent is listing property. */
    OWNER,

    /** Legacy value retained so accounts created before roles were split still load. */
    USER,

    /** Platform staff. Provisioned out of band, never through registration. */
    ADMIN
}
