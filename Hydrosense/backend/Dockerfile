# backend/Dockerfile for Laravel app
FROM php:8.3-fpm

# install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libonig-dev \
    libzip-dev \
    zip \
    curl \
    && docker-php-ext-install pdo_mysql mbstring zip exif pcntl

# install composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# copy existing application files
COPY . /var/www/html

# set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# expose port for artisan serve
EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0"]
