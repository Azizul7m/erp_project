package api

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

const (
	RoleAdmin    = "admin"
	RoleCustomer = "customer"
	RoleVendor   = "vendor"
)

func normalizeRole(value string) string {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case RoleAdmin:
		return RoleAdmin
	case RoleCustomer:
		return RoleCustomer
	case RoleVendor:
		return RoleVendor
	default:
		return ""
	}
}

func (app *App) RequireRoles(roles ...string) echo.MiddlewareFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		normalized := normalizeRole(role)
		if normalized != "" {
			allowed[normalized] = struct{}{}
		}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			role, _ := c.Get("userRole").(string)
			if _, ok := allowed[normalizeRole(role)]; !ok {
				return c.JSON(http.StatusForbidden, map[string]string{"message": "forbidden"})
			}
			return next(c)
		}
	}
}

func (app *App) resolveRegistrationRole(requested string) (string, error) {
	role := normalizeRole(requested)
	if role == RoleAdmin {
		role = ""
	}
	if role == "" {
		role = RoleCustomer
	}

	var total int
	if err := app.DB.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&total); err != nil {
		return "", err
	}
	if total == 0 {
		return RoleAdmin, nil
	}

	return role, nil
}

func (app *App) lookupUserRole(userID int64) (string, error) {
	var role string
	err := app.DB.QueryRow(`SELECT role FROM users WHERE id = $1`, userID).Scan(&role)
	if err != nil {
		return "", err
	}
	normalized := normalizeRole(role)
	if normalized == "" {
		return "", sql.ErrNoRows
	}
	return normalized, nil
}
