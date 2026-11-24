FROM kong:3.9
USER root
COPY backend/kong/kong.yml /kong/declarative/kong.yml
RUN sed -i \
    -e 's@host.docker.internal:3001@organization-service:3001@g' \
    -e 's@host.docker.internal:3002@hr-service:3002@g' \
    -e 's@host.docker.internal:3004@catalog-service:3004@g' \
    -e 's@host.docker.internal:3005@order-service:3005@g' \
    -e 's@host.docker.internal:3006@inventory-service:3006@g' \
    -e 's@host.docker.internal:3007@notification-service:3007@g' \
    /kong/declarative/kong.yml
USER kong
