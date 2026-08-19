<script setup lang='ts'>

</script>

<template>
    <div class="row justify-content-center mt-5">
   
        <div class="card border-0 rounded-4 shadow-sm " style="margin: 6em; padding:0;">
            <div class="card-header">
                Wedding Planner
            </div>
            <div class="card-body">
                <h4 class="card-title">Login</h4>
                <form @submit="">
                <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="floatingInput" placeholder="username">
                    <label for="">Username</label>
                </div>
                 <div class="form-floating mb-3">
                    <input type="password" class="form-control" id="floatingPassword" placeholder="username">
                    <label for="">Password</label>
                </div>
                <router-link to="/dashboard" class="btn btn-primary rounded-4 w-100">Login</router-link>
            </form>
            </div>
        </div>
       
        
    </div>
</template>