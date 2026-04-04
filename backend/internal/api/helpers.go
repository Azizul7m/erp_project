package api

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

func parseID(value string) (int64, error) {
	return strconv.ParseInt(strings.TrimSpace(value), 10, 64)
}

func cleanNullable(value *string) any {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return trimmed
}

func badRequest(c echo.Context, message string) error {
	return c.JSON(http.StatusBadRequest, map[string]string{"message": message})
}

func serverError(c echo.Context, err error) error {
	c.Logger().Error(err)
	return c.JSON(http.StatusInternalServerError, map[string]string{"message": "internal server error"})
}
