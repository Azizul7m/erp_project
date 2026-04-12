package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, app *App) {
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	api := e.Group("/api")
	api.POST("/register", app.HandleRegister)
	api.POST("/login", app.HandleLogin)

	protected := api.Group("")
	protected.Use(app.AuthMiddleware)
	protected.GET("/user", app.HandleCurrentUser)
	protected.GET("/customers", app.HandleListCustomers, app.RequireRoles(RoleAdmin, RoleCustomer))
	protected.POST("/customers", app.HandleCreateCustomer, app.RequireRoles(RoleAdmin))
	protected.PUT("/customers/:id", app.HandleUpdateCustomer, app.RequireRoles(RoleAdmin))
	protected.DELETE("/customers/:id", app.HandleDeleteCustomer, app.RequireRoles(RoleAdmin))
	protected.GET("/vendors", app.HandleListVendors, app.RequireRoles(RoleAdmin))
	protected.POST("/vendors", app.HandleCreateVendor, app.RequireRoles(RoleAdmin))
	protected.PUT("/vendors/:id", app.HandleUpdateVendor, app.RequireRoles(RoleAdmin))
	protected.DELETE("/vendors/:id", app.HandleDeleteVendor, app.RequireRoles(RoleAdmin))
	protected.GET("/products", app.HandleListProducts, app.RequireRoles(RoleAdmin, RoleCustomer, RoleVendor))
	protected.POST("/products", app.HandleCreateProduct, app.RequireRoles(RoleAdmin, RoleVendor))
	protected.PUT("/products/:id", app.HandleUpdateProduct, app.RequireRoles(RoleAdmin, RoleVendor))
	protected.DELETE("/products/:id", app.HandleDeleteProduct, app.RequireRoles(RoleAdmin, RoleVendor))
	protected.GET("/orders", app.HandleListOrders, app.RequireRoles(RoleAdmin, RoleCustomer, RoleVendor))
	protected.POST("/orders", app.HandleCreateOrder, app.RequireRoles(RoleAdmin, RoleCustomer))
	protected.GET("/orders/:id", app.HandleGetOrder, app.RequireRoles(RoleAdmin, RoleCustomer, RoleVendor))
	protected.GET("/transactions", app.HandleListTransactions, app.RequireRoles(RoleAdmin))
	protected.POST("/transactions", app.HandleCreateTransaction, app.RequireRoles(RoleAdmin))
}
